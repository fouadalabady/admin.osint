export default function DashboardLoading() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-screen">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <h2 className="mt-4 text-xl font-semibold">Loading Dashboard...</h2>
      <p className="text-muted-foreground mt-2">Please wait while we set up your experience</p>
    </div>
  );
}
