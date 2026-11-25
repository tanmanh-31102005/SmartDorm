import * as crypto from 'crypto';

/**
 * Nguyên tắc sinh mã thẻ RFID tự động theo sinh viên:
 * 1. Tiêu chuẩn phần cứng: Thẻ Mifare RC522 1K có 4 bytes UID vật lý biểu diễn bằng 8 ký tự Hex.
 * 2. Thuật toán sinh tất định & duy nhất: Băm SHA-256 chuỗi salt 'SMARTDORM_RFID_' kết hợp Mã Số Sinh Viên (studentId).
 * 3. Định dạng chuẩn: 'CARD_' + 8 ký tự Hex viết hoa (Ví dụ: CARD_8F3A1B2C).
 * 4. Tự động hóa: Cấp phát tự động ngay khi đăng ký hoặc khi được Admin xếp phòng.
 */
export function generateStudentRfid(studentId: string): string {
  const cleanId = (studentId || '').trim();
  if (!cleanId) {
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `CARD_${randomHex}`;
  }
  const hash = crypto.createHash('sha256').update(`SMARTDORM_RFID_${cleanId}`).digest('hex');
  const uidHex = hash.substring(0, 8).toUpperCase();
  return `CARD_${uidHex}`;
}
