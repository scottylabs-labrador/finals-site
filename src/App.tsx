import { SearchTable } from "./components/searchtable";
import { MyDataTable } from "./components/mydatatable";
import { Skeleton } from "./components/ui/skeleton";
import type { ColumnDef } from "@tanstack/react-table";

type FinalsInfo = {
  course: string;
  start_time: number;
  end_time: number;
  location: string;
}

import finals from "./assets/finals.json" with { type: "json" };
import { ThemeProvider } from "./components/theme-provider";
import { ModeToggle } from "./components/lightdark-toggle";


type FinalsDisplayData = {
  course_and_section: string;
  day: string;
  start: string;
  end: string;
  location: string;
}

export default function Home() {

  if (!finals) {
    return (<>
      <div className="fixed w-full h-full flex flex-col items-center justify-center">
        <Skeleton className="h-full w-3/4" />
      </div>
    </>);
  }

  const finalsData = finals?.map(({ course, start_time, end_time, location }: FinalsInfo) => {
    const course_and_section = course;
    const start = new Date(0)
    start.setUTCSeconds(start_time)
    const end = new Date(0)
    end.setUTCSeconds(end_time)



    return {
      course_and_section,
      day: start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      start: start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      end: end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      location,
    }
  });
  const columns: ColumnDef<FinalsDisplayData>[] = [
    {
      header: "Course",
      accessorKey: "course_and_section",
      filterFn: 'arrIncludesSome'
    },
    {
      header: "Day",
      accessorKey: "day",
    },
    {
      header: "Start Time",
      accessorKey: "start",
    },
    {
      header: "End Time",
      accessorKey: "end",
    },
    {
      header: "Location",
      accessorKey: "location",
    },
  ]
  return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <main className="flex min-h-screen flex-col items-center pt-10">
          <h1 className="text-4xl font-bold pb-5">Find your finals</h1>
          <div className="fixed top-4 right-4">
            <ModeToggle />
          </div>
          <MyDataTable columns={columns} data={finalsData} />
          <SearchTable columns={columns} data={finalsData} />
        </main> 
        </ThemeProvider>
  );
}