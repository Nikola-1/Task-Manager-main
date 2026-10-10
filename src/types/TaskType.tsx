export interface TaskType { //napravim tip za Task
  id: number;
  name: string;
  content: string | null;
  date: string | null;
  category_id: number | null;
  category?: { name: string | null; Stickers: { sticker_path: string | null } | null } | null;
  tags_tasks?: { id: number; Tags: { id: number; name: string | null; color: string | null } | null }[];
  Deleted: boolean;
  Completed: boolean;
  file_name:string;
  folder_name:string;
}
