export interface GenerativeResult {
  ok: boolean;
  data?: any;
  error?: string;
  humanText?: string;
}

export interface GenerativeExecutor {
  sku: string;
  execute(empresaId: string): Promise<GenerativeResult>;
}
