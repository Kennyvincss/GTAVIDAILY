import { redirect } from "next/navigation";

/** Moved: YouTube and X importing now live together on the Auto-import page. */
export default function YouTubeImportMoved() {
  redirect("/admin/auto-import");
}
