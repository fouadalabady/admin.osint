export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <h2 className="mt-4 text-xl font-semibold">Loading Dashboard...</h2>
      <p className="text-muted-foreground mt-2">Please wait while we load your content</p>
    </div>
  );
}
