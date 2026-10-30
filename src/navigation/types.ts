export type ReceiptStackParamList = {
  Captura: undefined;
  Revision: {
    imageBase64: string;
    mimeType: string;
  };
};

export type TabParamList = {
  Panel: undefined;
  Clientes: undefined;
  Comprobante: undefined;
  Ganancias: {
    charged?: string;
    currency?: string;
    transactionId?: string;
  } | undefined;
};
