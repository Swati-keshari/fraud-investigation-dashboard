import { CaseDetailPage } from "@/components/cases/CaseDetailPage";

// Next.js 15: route params are async and must be awaited.
export default async function Page({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  return <CaseDetailPage caseId={caseId} />;
}
