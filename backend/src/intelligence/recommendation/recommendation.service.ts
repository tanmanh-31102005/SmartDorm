import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../../gateway/events.gateway';
import { RecommendationResponseDto, RecommendationActionPayload } from '../dto/intelligence.dto';
import { AutomationService } from '../automation/automation.service';

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger('RecommendationService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
    @Inject(forwardRef(() => AutomationService))
    private readonly automationService: AutomationService,
  ) {}

  async getRecommendations(filters?: {
    type?: string;
    severity?: string;
    status?: string;
    roomId?: string;
    limit?: number;
  }): Promise<RecommendationResponseDto[]> {
    const where: any = {};
    if (filters?.type) where.type = filters.type;
    if (filters?.severity) where.severity = filters.severity;
    if (filters?.status) where.status = filters.status;
    if (filters?.roomId) where.location = filters.roomId;

    const recs = await this.prisma.aiRecommendation.findMany({
      where,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: filters?.limit || 50,
    });

    return recs.map(r => this.mapToDto(r));
  }

  async getById(id: string): Promise<RecommendationResponseDto> {
    const r = await this.prisma.aiRecommendation.findUnique({ where: { id } });
    if (!r) throw new NotFoundException(`Recommendation #${id} not found`);
    return this.mapToDto(r);
  }

  async createRecommendation(data: {
    type: string; // "ENERGY" | "DEVICE" | "SECURITY" | "OCCUPANCY" | "MAINTENANCE"
    severity?: 'INFO' | 'WARNING' | 'CRITICAL';
    title: string;
    description: string;
    location?: string;
    reason: string;
    recommendation: string;
    confidence?: number;
    evidence?: any;
    estimatedSavingsKwh?: number;
    actions?: RecommendationActionPayload[];
    expiresAt?: Date;
  }): Promise<RecommendationResponseDto> {
    // Deduplication: Avoid creating duplicate pending recommendations for the same room & type within last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const existing = await this.prisma.aiRecommendation.findFirst({
      where: {
        location: data.location,
        type: data.type,
        status: 'PENDING',
        createdAt: { gte: thirtyMinutesAgo },
      },
    });

    if (existing) {
      this.logger.debug(`Duplicate pending recommendation suppressed for location ${data.location} (${data.type})`);
      return this.mapToDto(existing);
    }

    const evidenceObj = {
      ...(data.evidence || {}),
      estimatedSavingsKwh: data.estimatedSavingsKwh,
      actions: data.actions,
    };

    const created = await this.prisma.aiRecommendation.create({
      data: {
        type: data.type,
        severity: data.severity || 'WARNING',
        title: data.title,
        description: data.description,
        location: data.location || null,
        reason: data.reason,
        recommendation: data.recommendation,
        confidence: data.confidence !== undefined ? data.confidence : 0.9,
        evidence: JSON.stringify(evidenceObj),
        status: 'PENDING',
        expiresAt: data.expiresAt || new Date(Date.now() + 24 * 3600 * 1000),
      },
    });

    const dto = this.mapToDto(created);

    // Broadcast in real-time via WebSocket
    this.eventsGateway.broadcastAiRecommendation(dto);

    return dto;
  }

  async acceptRecommendation(id: string, executeAction = true, userId?: string): Promise<RecommendationResponseDto> {
    const rec = await this.prisma.aiRecommendation.findUnique({ where: { id } });
    if (!rec) throw new NotFoundException(`Recommendation #${id} not found`);

    let executionResult = 'ACCEPTED_WITHOUT_ACTION';
    let executedAt: Date | null = null;
    let actions: RecommendationActionPayload[] = [];

    if (rec.evidence) {
      try {
        const parsed = JSON.parse(rec.evidence);
        if (Array.isArray(parsed.actions)) {
          actions = parsed.actions;
        }
      } catch {}
    }

    if (executeAction) {
      if (actions.length === 0) {
        // Auto-infer action from recommendation type & location
        let targetRoom = 'room-101';
        if (rec.location) {
          if (rec.location.includes('204')) targetRoom = '204';
          else if (rec.location.includes('301')) targetRoom = '301';
          else if (rec.location.includes('101')) targetRoom = '101';
        }

        if (rec.type === 'ENERGY') {
          actions = [
            { type: 'LIGHT_OFF', targetRoomId: targetRoom, description: 'Tắt đèn phòng tiết kiệm điện' },
            { type: 'FAN_OFF', targetRoomId: targetRoom, description: 'Tắt quạt thông gió' },
          ];
        } else if (rec.type === 'DEVICE') {
          actions = [{ type: 'FAN_OFF', targetRoomId: targetRoom, description: 'Ngắt nguồn thiết bị quá tải' }];
        } else if (rec.type === 'OCCUPANCY') {
          actions = [{ type: 'LIGHT_OFF', targetRoomId: targetRoom, description: 'Tắt hệ thống chiếu sáng khu vực trống' }];
        } else if (rec.type === 'SECURITY') {
          actions = [{ type: 'DOOR_LOCK', targetRoomId: targetRoom, description: 'Khóa chốt cửa an ninh' }];
        } else {
          actions = [{ type: 'LIGHT_OFF', targetRoomId: targetRoom, description: 'Thực thi tối ưu' }];
        }
      }

      try {
        const execRes = await this.automationService.executeActions(
          actions,
          'AI_RECOMMENDATION',
          userId,
          rec.location || undefined,
        );
        executionResult = execRes.success ? 'SUCCESS' : `PARTIAL_OR_FAILED: ${execRes.message}`;
        executedAt = new Date();
      } catch (err: any) {
        executionResult = `EXECUTION_ERROR: ${err.message}`;
      }
    }


    const updated = await this.prisma.aiRecommendation.update({
      where: { id },
      data: {
        status: executeAction && actions.length > 0 ? 'EXECUTED' : 'ACCEPTED',
        acceptedBy: userId || 'admin',
        acceptedAt: new Date(),
        executedAt,
        executionResult,
      },
    });

    const dto = this.mapToDto(updated);
    this.eventsGateway.broadcastAiRecommendation(dto);
    return dto;
  }

  async dismissRecommendation(id: string, userId?: string, reason?: string): Promise<RecommendationResponseDto> {
    const rec = await this.prisma.aiRecommendation.findUnique({ where: { id } });
    if (!rec) throw new NotFoundException(`Recommendation #${id} not found`);

    const updated = await this.prisma.aiRecommendation.update({
      where: { id },
      data: {
        status: 'DISMISSED',
        dismissedAt: new Date(),
        executionResult: reason ? `DISMISSED: ${reason}` : 'DISMISSED_BY_USER',
      },
    });

    const dto = this.mapToDto(updated);
    this.eventsGateway.broadcastAiRecommendation(dto);
    return dto;
  }

  async getPendingCount(): Promise<number> {
    return this.prisma.aiRecommendation.count({ where: { status: 'PENDING' } });
  }

  private mapToDto(r: any): RecommendationResponseDto {
    let evidenceObj: any = null;
    let actions: RecommendationActionPayload[] = [];
    let estimatedSavingsKwh: number | undefined;

    if (r.evidence) {
      try {
        evidenceObj = typeof r.evidence === 'string' ? JSON.parse(r.evidence) : r.evidence;
        if (evidenceObj?.actions) actions = evidenceObj.actions;
        if (evidenceObj?.estimatedSavingsKwh) estimatedSavingsKwh = evidenceObj.estimatedSavingsKwh;
      } catch {
        evidenceObj = r.evidence;
      }
    }

    return {
      id: r.id,
      type: r.type as any,
      severity: r.severity as any,
      title: r.title,
      description: r.description,
      location: r.location,
      reason: r.reason,
      recommendation: r.recommendation,
      confidence: r.confidence,
      evidence: evidenceObj,
      status: r.status as any,
      estimatedSavingsKwh,
      actions,
      acceptedBy: r.acceptedBy,
      acceptedAt: r.acceptedAt,
      dismissedAt: r.dismissedAt,
      executedAt: r.executedAt,
      executionResult: r.executionResult,
      expiresAt: r.expiresAt,
      createdAt: r.createdAt,
    };
  }
}
