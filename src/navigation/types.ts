export type ReceiptStackParamList = {
  Captura: undefined;
  Revision: {
    imageBase64: string;
    mimeType: string;
  };
};

export type TabParamList = {
  Comprobante: undefined;
  Ganancias: {
    charged?: string;
    currency?: string;
    transactionId?: string;
  } | undefined;
  Jornada: undefined;
};
