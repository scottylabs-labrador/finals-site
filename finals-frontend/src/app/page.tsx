"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SearchTable } from "@/components/searchtable";
import { ColumnDef } from "@tanstack/react-table";
import { UserButton } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider} from "@tanstack/react-query";
import { MyDataTable } from "@/components/mydatatable";
import { Skeleton } from "@/components/ui/skeleton";

type FinalsInfo = {
  _id: string;
  course: string;
  start_time: number;
  end_time: number;
  location: string;
}

type FinalsDisplayData = {
  course_and_section: string;
  day: string;
  start: string;
  end: string;
  location: string;
}

const rootQueryClient = new QueryClient();

export default function Home() {
  const finals = useQuery(api.finals.get);


  if (!finals) {
    return (<>
    <div className="fixed w-full h-full flex flex-col items-center justify-center">
      <Skeleton className="h-full w-3/4"/>
    </div>
    </>);
  }

  const finalsData = finals?.map(({course, start_time, end_time, location}: FinalsInfo ) => {
    const course_and_section = course;
    const start = new Date(0)
    start.setUTCSeconds(start_time)
    const end = new Date(0)
    end.setUTCSeconds(end_time)

    

    return {
      course_and_section,
      day: start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      start: start.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'}),
      end: end.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'}),
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
    <QueryClientProvider client={rootQueryClient}>
      <main className="flex min-h-screen flex-col items-center pt-10">
        <div className="fixed right-10"> <UserButton /> </div>
        <h1 className="text-4xl font-bold pb-5">Find your finals</h1>
        <MyDataTable columns={columns} data={finalsData} />
        <SearchTable columns={columns} data={finalsData} />
      </main>
    </QueryClientProvider>
  );
}