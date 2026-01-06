import { QRCodeSVG } from "qrcode.react";
import type { PaymentMethod } from "@/types";
import { formatCurrency } from "@/lib/format";
import { getDefaultPaymentSettings, type PaymentSettings } from "@/services/paymentSettingsService";
import { useEffect, useState } from "react";

interface PaymentQRProps {
  paymentMethod: PaymentMethod;
  amount: number;
  orderCode?: string;
  bankAccount?: string;
  bankName?: string;
  accountName?: string;
}

/**
 * Component to display QR code for payment methods
 * Supports VietQR, Bank Transfer, and E-wallet payments
 * 
 * IMPORTANT:
 * - VietQR: Uses EMV QR Code format - CAN BE SCANNED by banking apps for actual payment
 * - Bank Transfer: Displays account info (most apps don't scan QR for transfers)
 * - E-wallet: May require official API integration for production use
 */
export function PaymentQR({
  paymentMethod,
  amount,
  orderCode,
  bankAccount: propBankAccount,
  bankName: propBankName,
  accountName: propAccountName,
}: PaymentQRProps) {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Load payment settings from API
   */
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const defaultSettings = await getDefaultPaymentSettings(paymentMethod);
        setSettings(defaultSettings);
      } catch (error) {
        console.error("Error loading payment settings:", error);
      } finally {
        setLoading(false);
      }
    };

    if (paymentMethod !== "Cash") {
      loadSettings();
    } else {
      setLoading(false);
    }
  }, [paymentMethod]);

  /**
   * Use props if provided, otherwise use settings from API
   */
  const bankAccount = propBankAccount || settings?.accountNumber || settings?.phoneNumber || "";
  const bankName = propBankName || settings?.bankName || "";
  const accountName = propAccountName || settings?.accountName || "";
  /**
   * Generate EMV QR Code string format for VietQR
   * Follows EMV QR Code specification for Vietnam (VietQR standard)
   * Format: 00020101021238[Bank Info]54[Amount]58[Country]59[Merchant]62[Additional]63[CRC]
   * 
   * According to VietQR standard:
   * - Bank Code must be 3 digits (e.g., 970422 for Vietcombank)
   * - Merchant Account Information (38) contains: ID 00 (Bank Code) + ID 01 (Account Number)
   * 
   * @returns EMV QR Code string that can be scanned by banking apps
   */
  const generateVietQRString = (): string => {
    if (!bankAccount || !settings?.bankCode) {
      return "";
    }

    // Normalize bank code - ensure it's numeric and properly formatted
    const bankCode = settings.bankCode.trim().replace(/\D/g, "");
    if (bankCode.length === 0) {
      return "";
    }
    
    const accountNumber = bankAccount.trim();
    if (accountNumber.length === 0) {
      return "";
    }
    
    const merchantName = (accountName || "Merchant").trim();
    const transactionAmount = Math.round(amount).toString();
    const content = orderCode ? `Thanh toan don ${orderCode}` : `Thanh toan ${formatCurrency(amount)}`;
    
    // EMV QR Code structure
    // Payload Format Indicator (00): 01 = EMV QR Code
    let qrString = "000201";
    
    // Point of Initiation Method (01): 12 = dynamic QR (with amount)
    qrString += "010212";
    
    // Merchant Account Information (38)
    // Format: 00[Bank Code Length][Bank Code]01[Account Number Length][Account Number]
    // ID 00: Bank code (2-digit length + code)
    // ID 01: Account number (2-digit length + number)
    // Note: Length values are the byte length of the value (for ASCII, same as character count)
    const bankCodeLength = bankCode.length;
    const accountNumberLength = accountNumber.length;
    
    // Build bank info: ID 00 (Bank Code) + ID 01 (Account Number)
    const bankInfo = `00${String(bankCodeLength).padStart(2, "0")}${bankCode}01${String(accountNumberLength).padStart(2, "0")}${accountNumber}`;
    
    // Field 38 length is the byte length of bankInfo
    const bankInfoLength = bankInfo.length;
    qrString += `38${String(bankInfoLength).padStart(2, "0")}${bankInfo}`;
    
    // Transaction Currency (53): 704 = VND
    qrString += "5303704";
    
    // Transaction Amount (54)
    const amountStr = transactionAmount;
    qrString += `54${String(amountStr.length).padStart(2, "0")}${amountStr}`;
    
    // Country Code (58): VN
    qrString += "5802VN";
    
    // Merchant Name (59) - Max 25 characters
    // Truncate to ensure it fits within byte limit
    let merchantNameStr = merchantName;
    while (getByteLength(merchantNameStr) > 25 && merchantNameStr.length > 0) {
      merchantNameStr = merchantNameStr.substring(0, merchantNameStr.length - 1);
    }
    const merchantNameLength = getByteLength(merchantNameStr);
    qrString += `59${String(merchantNameLength).padStart(2, "0")}${merchantNameStr}`;
    
    // Additional Data Field Template (62)
    // Format: 08[Content/Reference Number] - Max 25 characters
    let contentStr = content;
    while (getByteLength(contentStr) > 25 && contentStr.length > 0) {
      contentStr = contentStr.substring(0, contentStr.length - 1);
    }
    const contentLength = getByteLength(contentStr);
    const additionalData = `08${String(contentLength).padStart(2, "0")}${contentStr}`;
    const additionalDataLength = getByteLength(additionalData);
    qrString += `62${String(additionalDataLength).padStart(2, "0")}${additionalData}`;
    
    // CRC (63) - Cyclic Redundancy Check
    // Calculate CRC16-CCITT for the string BEFORE adding CRC field
    // According to EMV QR Code spec, CRC is calculated on the payload without the CRC field
    const crc = calculateCRC16(qrString);
    qrString += `6304${crc}`;
    
    return qrString;
  };

  /**
   * Get UTF-8 byte length of a string
   * EMV QR Code requires length to be in bytes, not characters
   * 
   * @param str - String to get byte length for
   * @returns Byte length of the string in UTF-8 encoding
   */
  const getByteLength = (str: string): number => {
    // Use TextEncoder to get accurate UTF-8 byte length
    if (typeof TextEncoder !== "undefined") {
      return new TextEncoder().encode(str).length;
    }
    // Fallback: approximate for ASCII, but may be inaccurate for UTF-8
    // For most cases with Vietnamese characters, this should work
    let byteLength = 0;
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      if (charCode < 0x80) {
        byteLength += 1;
      } else if (charCode < 0x800) {
        byteLength += 2;
      } else if (charCode < 0xD800 || charCode >= 0xE000) {
        byteLength += 3;
      } else {
        // Surrogate pair
        byteLength += 4;
        i++; // Skip next character as it's part of the pair
      }
    }
    return byteLength;
  };

  /**
   * Calculate CRC16-CCITT checksum for EMV QR Code
   * Uses standard CRC16-CCITT algorithm (polynomial 0x1021, initial value 0xFFFF)
   * 
   * @param data - String to calculate CRC for
   * @returns 4-character hex CRC value (uppercase, zero-padded)
   */
  const calculateCRC16 = (data: string): string => {
    let crc = 0xFFFF;
    
    // Process each byte in the string
    for (let i = 0; i < data.length; i++) {
      const byte = data.charCodeAt(i);
      crc ^= (byte << 8);
      
      // Process 8 bits
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
        } else {
          crc = (crc << 1) & 0xFFFF;
        }
      }
    }
    
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, "0");
  };

  /**
   * Generate Bank Transfer QR string
   * Uses EMV QR Code format if Bank Code is available, otherwise uses text format
   * EMV format allows banking apps to scan and process the transfer
   * 
   * @returns EMV QR Code string (if Bank Code available) or text format
   */
  const generateBankTransferString = (): string => {
    // If Bank Code is available, use EMV QR Code format (same as VietQR)
    if (settings?.bankCode && bankAccount) {
      const bankCode = settings.bankCode;
      const accountNumber = bankAccount;
      const merchantName = accountName || "Merchant";
      const transactionAmount = Math.round(amount).toString();
      const content = orderCode ? `Chuyen khoan don ${orderCode}` : `Chuyen khoan ${formatCurrency(amount)}`;
      
      // EMV QR Code structure (same as VietQR)
      let qrString = "000201";
      
      // Point of Initiation Method (01): 12 = dynamic QR (with amount)
      qrString += "010212";
      
      // Merchant Account Information (38)
      // Format: 00[Bank Code Length][Bank Code]01[Account Number Length][Account Number]
      // ID 00: Bank code (2-digit length + code)
      // ID 01: Account number (2-digit length + number)
      // Normalize bank code - ensure it's numeric
      const normalizedBankCode = bankCode.trim().replace(/\D/g, "");
      if (normalizedBankCode.length === 0) {
        // Fallback to text format if bank code is invalid
        const transferInfo = [
          `Bank: ${bankName || "N/A"}`,
          `Account: ${bankAccount}`,
          `Name: ${accountName}`,
          `Amount: ${Math.round(amount)} VND`,
          orderCode ? `Order: ${orderCode}` : ""
        ].filter(Boolean).join("\n");
        return transferInfo;
      }
      
      const bankCodeLength = normalizedBankCode.length;
      const accountNumberLength = accountNumber.length;
      const bankInfo = `00${String(bankCodeLength).padStart(2, "0")}${normalizedBankCode}01${String(accountNumberLength).padStart(2, "0")}${accountNumber}`;
      const bankInfoLength = bankInfo.length;
      qrString += `38${String(bankInfoLength).padStart(2, "0")}${bankInfo}`;
      
      // Transaction Currency (53): 704 = VND
      qrString += "5303704";
      
      // Transaction Amount (54)
      qrString += `54${String(transactionAmount.length).padStart(2, "0")}${transactionAmount}`;
      
      // Country Code (58): VN
      qrString += "5802VN";
      
      // Merchant Name (59) - Max 25 bytes
      let merchantNameStr = merchantName.trim();
      while (getByteLength(merchantNameStr) > 25 && merchantNameStr.length > 0) {
        merchantNameStr = merchantNameStr.substring(0, merchantNameStr.length - 1);
      }
      const merchantNameLength = getByteLength(merchantNameStr);
      qrString += `59${String(merchantNameLength).padStart(2, "0")}${merchantNameStr}`;
      
      // Additional Data Field Template (62) - Max 25 bytes
      let contentStr = content;
      while (getByteLength(contentStr) > 25 && contentStr.length > 0) {
        contentStr = contentStr.substring(0, contentStr.length - 1);
      }
      const contentLength = getByteLength(contentStr);
      const additionalData = `08${String(contentLength).padStart(2, "0")}${contentStr}`;
      const additionalDataLength = getByteLength(additionalData);
      qrString += `62${String(additionalDataLength).padStart(2, "0")}${additionalData}`;
      
      // CRC (63) - Cyclic Redundancy Check
      // Calculate CRC16-CCITT for the string BEFORE adding CRC field
      const crc = calculateCRC16(qrString);
      qrString += `6304${crc}`;
      
      return qrString;
    }
    
    // Fallback to text format if no Bank Code
    const transferInfo = [
      `Bank: ${bankName || "N/A"}`,
      `Account: ${bankAccount}`,
      `Name: ${accountName}`,
      `Amount: ${Math.round(amount)} VND`,
      orderCode ? `Order: ${orderCode}` : ""
    ].filter(Boolean).join("\n");
    
    return transferInfo;
  };

  /**
   * Generate E-wallet QR string (Momo/ZaloPay)
   * Note: Actual e-wallet QR codes require API integration with payment gateways
   * This provides a basic format that may work with some apps
   * 
   * @returns Payment link or account info string
   */
  const generateEwalletString = (): string => {
    const phoneNumber = bankAccount || settings?.phoneNumber || "";
    const amountStr = Math.round(amount).toString();
    const note = orderCode ? `Don hang ${orderCode}` : "Thanh toan";
    
    if (paymentMethod === "Momo") {
      // MoMo deep link format (may require official API for production)
      return `momo://transfer?phone=${phoneNumber}&amount=${amountStr}&note=${encodeURIComponent(note)}`;
    } else if (paymentMethod === "ZaloPay") {
      // ZaloPay format (may require official API for production)
      return `zalopay://transfer?phone=${phoneNumber}&amount=${amountStr}&note=${encodeURIComponent(note)}`;
    }
    
    return "";
  };

  /**
   * Get QR code value based on payment method
   */
  const getQRValue = (): string => {
    switch (paymentMethod) {
      case "VietQR":
        return generateVietQRString();
      case "BankTransfer":
        return generateBankTransferString();
      case "Momo":
      case "ZaloPay":
        return generateEwalletString();
      default:
        return "";
    }
  };

  /**
   * Get payment method display name
   */
  const getPaymentMethodName = (): string => {
    switch (paymentMethod) {
      case "VietQR":
        return "VietQR";
      case "BankTransfer":
        return "Chuyển khoản";
      case "Momo":
        return "Ví MoMo";
      case "ZaloPay":
        return "Ví ZaloPay";
      default:
        return "";
    }
  };

  /**
   * Get payment instructions based on method
   */
  const getPaymentInstructions = (): string => {
    switch (paymentMethod) {
      case "VietQR":
        return "Quét mã QR bằng ứng dụng ngân hàng để thanh toán";
      case "BankTransfer":
        if (settings?.bankCode) {
          return "Quét mã QR bằng ứng dụng ngân hàng để chuyển khoản";
        }
        return `Chuyển khoản đến:\n${bankName}\nSTK: ${bankAccount}\nTên: ${accountName}`;
      case "Momo":
        return "Quét mã QR bằng ứng dụng MoMo để thanh toán";
      case "ZaloPay":
        return "Quét mã QR bằng ứng dụng ZaloPay để thanh toán";
      default:
        return "";
    }
  };

  const qrValue = getQRValue();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-6">
        <div className="text-center">Đang tải thông tin thanh toán...</div>
      </div>
    );
  }

  if (!qrValue || (!bankAccount && paymentMethod !== "Cash")) {
    const missingInfo = (paymentMethod === "VietQR" || paymentMethod === "BankTransfer") && !settings?.bankCode 
      ? " (khuyến nghị thêm mã ngân hàng để tạo QR có thể quét)"
      : "";
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-6">
        <div className="text-center text-muted-foreground">
          <p>Chưa cấu hình thông tin thanh toán{missingInfo}</p>
          <p className="text-sm mt-2">Vui lòng cấu hình trong Settings</p>
          {paymentMethod === "VietQR" && !settings?.bankCode && (
            <p className="text-xs mt-1 text-amber-600">
              Lưu ý: VietQR cần mã ngân hàng (Bank Code) để tạo mã QR có thể quét được
            </p>
          )}
          {paymentMethod === "BankTransfer" && !settings?.bankCode && (
            <p className="text-xs mt-1 text-amber-600">
              Lưu ý: Thêm mã ngân hàng để tạo mã QR EMV có thể quét bằng ứng dụng ngân hàng
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4 p-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Thanh toán qua {getPaymentMethodName()}</h3>
        <p className="text-2xl font-bold text-primary">{formatCurrency(amount)}</p>
        {orderCode && (
          <p className="text-sm text-muted-foreground">Mã đơn: {orderCode}</p>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg border-2 border-primary/20">
        <QRCodeSVG
          value={qrValue}
          size={256}
          level="H"
          includeMargin={true}
        />
      </div>

      {(paymentMethod === "BankTransfer") && (
        <div className="text-center space-y-1 text-sm bg-muted p-4 rounded-lg w-full">
          <p className="font-medium">{bankName}</p>
          <p>Số tài khoản: <span className="font-mono font-semibold">{bankAccount}</span></p>
          <p>Chủ tài khoản: <span className="font-semibold">{accountName}</span></p>
          {settings?.bankCode && (
            <p className="text-xs text-muted-foreground">Mã ngân hàng: {settings.bankCode}</p>
          )}
          <p className="text-muted-foreground mt-2">Số tiền: {formatCurrency(amount)}</p>
          {!settings?.bankCode && (
            <p className="text-xs text-amber-600 mt-2">
              ⚠️ Thêm mã ngân hàng trong Settings để tạo mã QR EMV có thể quét
            </p>
          )}
        </div>
      )}

      <p className="text-sm text-center text-muted-foreground max-w-xs">
        {getPaymentInstructions()}
      </p>

      <div className="text-xs text-center text-muted-foreground">
        Vui lòng xác nhận sau khi thanh toán thành công
      </div>
    </div>
  );
}

