"use client"

import { SignInButton, useUser } from "@clerk/nextjs"
import { getSchedule, postSchedule } from "@/lib/schedules"

import { useQuery as tanUseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef, ColumnFiltersState, getCoreRowModel, getFilteredRowModel, useReactTable } from "@tanstack/react-table";
import ical from 'ical';
import { FaSliders } from "react-icons/fa6";
import DataTable from "./datatable";
import React, { useState } from "react";
import { Skeleton } from "./ui/skeleton";


interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export interface CourseData {
  name: string;
  code: string;
  section: string;
  instructors: string;
  room: string;
  dow: string;
  start: Date;
  end: Date;
}

const dayMap = {
  0: 'M', // Monday
  1: 'T', // Tuesday
  2: 'W', // Wednesday
  3: 'R', // Thursday
  4: 'F', // Friday
  5: 'S', // Saturday
  6: 'U', // Sunday
};

export function MyDataTable<TData, TValue>({
  columns,
  data: finalsData,
}: DataTableProps<TData, TValue>) {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const myFinalsTable = useReactTable({
    data: finalsData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
    },
  })

  const { data, isLoading } = tanUseQuery({ queryKey: ["schedule", user?.id], queryFn: async () => {
    const s = await getSchedule(user?.id)
    myFinalsTable.getColumn("course_and_section")?.setFilterValue(s.map((c: any)=>c.code+""+c.section))
    return s;

  }
  });

  
  if (!user) {
    return <div className="flex py-5 gap-[2px]"> <div className="px-2 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"> <SignInButton/> </div> to view your schedule</div>;
  }
  if (user && isLoading) {
    return  <Skeleton className="h-6 w-3/4 m-5"/> 
  }
  

  const scheduleData: CourseData[] = data;

  const handleFileChange = (event: any) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsText(file);

      reader.onload = async (e) => {
        const newScheduleData: CourseData[] = [];

        for (const course of Object.values(
          ical.parseICS(e.target?.result as string),
        )) {
          if (!course) {
            continue;
          }

          const curCourse: Partial<CourseData> = {};
          curCourse.name = course.summary?.split(' :: ')[0];
          curCourse.code = course.summary?.split(' :: ')[1].split(' ')[0];
          curCourse.section = course.summary?.slice(-1);
          curCourse.instructors = course.description
            ?.split('\n')[2]
            .replace('Instructors:', '')
            .replace('Instructor:', '');
          curCourse.room = course.location?.replace(' ', '');
          curCourse.dow = course.rrule?.options.byweekday
            .map((day) => dayMap[(day as 0 | 1 | 2 | 3 | 4 | 5 | 6)])
            .join('');
          curCourse.start = course.start;
          curCourse.end = course.end;
          newScheduleData.push(curCourse as CourseData);
        }

        if (user) {
          await postSchedule(user.id, JSON.stringify(newScheduleData));
          queryClient.invalidateQueries({ queryKey: ["schedule", user.id] });
        }
      };
    }
  };

  const renderSchedule = () => {
    const formatDate = (date: Date) => {
      return `${new Date(date).getHours().toString().padStart(2, '0')}:${new Date(date).getMinutes().toString().padStart(2, '0')}`;
    };

    return (
      <div className="h-96 space-y-3 overflow-auto pl-5 pr-2">
        {scheduleData.map((course) => (
          <button
            key={course.code + course.dow}
            className="w-full rounded border bg-gray-50 p-1 text-left hover:bg-gray-300"
          >
            <h3 className="truncate text-gray-700">
              {course.code} {course.name}
            </h3>
            <div className="text-gray-500">
              <div className="flex justify-between">
                <p>Section {course.section}</p>
                <p>{course.instructors}</p>
              </div>
              <div className="flex justify-between">
                <p>
                  {course.dow} {formatDate(course.start)}-
                  {formatDate(course.end)}
                </p>
                <p>{course.room}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  };

  const renderFinals = () => {
    return <DataTable columns={columns} table={myFinalsTable} />
  };

  const renderNoSchedule = () => {
    return (
      <div className="ml-5 text-gray-700">
        <p>
          1: Download{' '}
          <a
            target="_blank"
            rel="noreferrer"
            href="https://s3.andrew.cmu.edu/sio/mpa/secure/export/schedule/F24_schedule.ics"
          >
            <span className="text-blue-600 underline">Calendar Export</span>
          </a>{' '}
          from SIO
        </p>
        <p>2: Import the .ics file here:</p>
        <label className="cursor-pointer rounded-md bg-blue-600 px-2 py-1 font-medium text-white">
          <FaSliders className="inline-block pr-2 pb-[.5px] w-[25px] h-[25px]"/>
          Upload Schedule
        <input
          type="file"
          id="fileInput"
          accept=".ics"
          onChange={handleFileChange}
          className="hidden"
        />
        </label>

      </div>
      
    );
  };

  const renderReuploadButton = () => {
    return (
      <div className="flex justify-end">
        {/* Upload New Button, hide default html picker */}
        <label className="mb-1 mr-4 cursor-pointer rounded-md bg-blue-600 px-2 py-1 font-medium text-white">
          <FaSliders className="inline-block pr-2 pb-[.5px] w-[25px] h-[25px]"/>
          Upload New Schedule
          <input
            type="file"
            id="reUploadFileInput"
            accept=".ics"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col items-center w-1/4">
        <div className="space-y-2 pb-2">
          {scheduleData ? renderFinals() : renderNoSchedule()}
        </div>
        {scheduleData ? renderReuploadButton() : null}
      </div>
    </>
  );
}