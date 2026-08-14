export type UrlStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';

export interface JobUrlProps {
  id?: string;
  jobId: string;
  url: string;
  status?: UrlStatus;
  originalTitle?: string | null;
  originalH1?: string | null;
  generatedTitle?: string | null;
  titleLength?: number | null;
  generatedDescription?: string | null;
  descriptionLength?: number | null;
  attempts?: number;
  error?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class JobUrlEntity {
  public readonly id: string;
  public readonly jobId: string;
  public readonly url: string;
  public status: UrlStatus;
  public originalTitle: string | null;
  public originalH1: string | null;
  public generatedTitle: string | null;
  public titleLength: number | null;
  public generatedDescription: string | null;
  public descriptionLength: number | null;
  public attempts: number;
  public error: string | null;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(props: JobUrlProps) {
    this.id = props.id || crypto.randomUUID();
    this.jobId = props.jobId;
    this.url = props.url;
    this.status = props.status || 'PENDING';
    this.originalTitle = props.originalTitle || null;
    this.originalH1 = props.originalH1 || null;
    this.generatedTitle = props.generatedTitle || null;
    this.titleLength = props.titleLength ?? (props.generatedTitle ? props.generatedTitle.length : null);
    this.generatedDescription = props.generatedDescription || null;
    this.descriptionLength = props.descriptionLength ?? (props.generatedDescription ? props.generatedDescription.length : null);
    this.attempts = props.attempts || 0;
    this.error = props.error || null;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  recordSuccess(title: string, description: string): void {
    this.status = 'SUCCESS';
    this.generatedTitle = title;
    this.titleLength = title.length;
    this.generatedDescription = description;
    this.descriptionLength = description.length;
    this.error = null;
    this.updatedAt = new Date();
  }

  recordFailure(errorMessage: string): void {
    this.status = 'FAILED';
    this.error = errorMessage;
    this.updatedAt = new Date();
  }
}
