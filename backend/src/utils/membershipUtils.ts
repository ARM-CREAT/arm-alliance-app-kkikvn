import qrcode from 'qrcode';

/**
 * Generate unique membership number in format: ARM-YYYY-XXXXX
 * YYYY = current year, XXXXX = sequential number
 */
export function generateMembershipNumber(sequenceNumber: number): string {
  const year = new Date().getFullYear();
  const paddedNumber = String(sequenceNumber).padStart(5, '0');
  return `ARM-${year}-${paddedNumber}`;
}

/**
 * Generate QR code data as base64 string
 * Contains: membershipNumber, fullName, status
 */
export async function generateQRCode(
  membershipNumber: string,
  fullName: string,
  status: string
): Promise<string> {
  try {
    const qrData = {
      membershipNumber,
      fullName,
      status,
      issuedAt: new Date().toISOString(),
    };

    // Generate QR code as data URL
    const qrString = JSON.stringify(qrData);
    const qrDataUrl = await qrcode.toDataURL(qrString, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
    });

    // Return as base64 string
    return qrDataUrl.toString();
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    throw new Error('QR code generation failed');
  }
}

/**
 * Generate mock payment instructions for various payment methods
 */
export function getPaymentInstructions(
  paymentMethod: string,
  amount: number,
  transactionRef: string
): { instructions: string; details: Record<string, string> } {
  const maliCurrency = 'XOF'; // West African CFA franc

  switch (paymentMethod) {
    case 'sama_money':
      return {
        instructions: `Send ${amount} ${maliCurrency} to A.R.M Party via Sama Money`,
        details: {
          provider: 'Sama Money',
          phoneNumber: '+223 75 XX XX XX',
          reference: transactionRef,
          amount: `${amount} ${maliCurrency}`,
          note: 'A.R.M Membership Fee',
        },
      };

    case 'orange_money':
      return {
        instructions: `Send ${amount} ${maliCurrency} to A.R.M Party via Orange Money`,
        details: {
          provider: 'Orange Money',
          merchantCode: 'ARM001',
          reference: transactionRef,
          amount: `${amount} ${maliCurrency}`,
          note: 'A.R.M Membership Fee',
        },
      };

    case 'moov_money':
      return {
        instructions: `Send ${amount} ${maliCurrency} to A.R.M Party via Moov Money`,
        details: {
          provider: 'Moov Money',
          phoneNumber: '+223 99 XX XX XX',
          reference: transactionRef,
          amount: `${amount} ${maliCurrency}`,
          note: 'A.R.M Membership Fee',
        },
      };

    case 'bank_transfer':
      return {
        instructions: `Transfer ${amount} ${maliCurrency} via bank transfer`,
        details: {
          bankName: 'Bank of Mali',
          accountName: 'Alliance pour le Rassemblement Malien',
          accountNumber: 'XXXX-XXXX-XXXX-XXXX',
          swiftCode: 'BMMLMLPA',
          reference: transactionRef,
          amount: `${amount} ${maliCurrency}`,
        },
      };

    default:
      return {
        instructions: 'Payment method not supported',
        details: {},
      };
  }
}

/**
 * Get next sequence number for membership
 * In production, this would query the database for the highest number
 */
export async function getNextMembershipSequenceNumber(
  lastSequenceNumber: number
): Promise<number> {
  return lastSequenceNumber + 1;
}
