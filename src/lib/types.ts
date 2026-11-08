export type ItemType = "note" | "link" | "image" | "video" | "article" | "game" | "drawing";
export type Role = "owner" | "editor" | "viewer";

export interface Item {
  id: string;
  space_id: string;
  type: ItemType;
  x: number;
  y: number;
  width: number;
  height: number;
  z_index: number;
  content: Record<string, any>;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Space {
  id: string;
  name: string;
  owner_id: string;
  is_public: boolean;
  invite_code?: string | null;
  created_at?: string;
}
