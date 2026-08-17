import { ProjectEntity } from '../entities/ProjectEntity.ts';

export interface ProjectRepository {
  save(project: ProjectEntity): Promise<void>;
  findById(id: string): Promise<ProjectEntity | null>;
  findAll(): Promise<ProjectEntity[]>;
  delete(id: string): Promise<void>;
}
