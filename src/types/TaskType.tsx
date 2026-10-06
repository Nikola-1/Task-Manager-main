export interface TaskType { //napravim tip za Task
  id: number;
  name: string;
  content: string | null;
  date: string | null;
  category_id: number | null;
  Deleted: boolean;
  Completed: boolean;
  file_name:string;
  folder_name:string;
}