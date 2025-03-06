"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { DataTable } from "@/components/datatable";
import { ColumnDef } from "@tanstack/react-table";

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

export default function Home() {
  const finals = useQuery(api.finals.get);
  if (!finals) {
    return <div>Loading...</div>;
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
    <main className="flex min-h-screen flex-col items-center pt-10">
      <h1 className="text-4xl font-bold pb-5">Find your finals</h1>
      <DataTable columns={columns} data={finalsData} />
    </main>
  );
}