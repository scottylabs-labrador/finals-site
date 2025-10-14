
import { type ColumnDef, type ColumnFiltersState, getCoreRowModel, getFilteredRowModel, useReactTable } from "@tanstack/react-table";
import ical from 'ical';
import { FaSliders } from "react-icons/fa6";
import DataTable from "./datatable";
import { type FormEvent, useEffect, useState } from "react";


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

  const [userSchedule, setUserSchedule] = useState<CourseData[] | null>(null);

  useEffect(() => {
    const mySchedule = localStorage.getItem("mySchedule");
    const scheduleData: CourseData[] = mySchedule ? JSON.parse(mySchedule) : null;
    setUserSchedule(scheduleData);
    myFinalsTable.getColumn("course_and_section")?.setFilterValue(scheduleData.map((c: {code: string, section: string})=>c.code+""+c.section))
  }, []);

  const handleFileChange = (event: FormEvent) => {
    const file = (event.target as HTMLInputElement)?.files?.[0];
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
        setUserSchedule(newScheduleData);
        localStorage.setItem("mySchedule", JSON.stringify(newScheduleData));
      };
    }
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
            href="https://s3.andrew.cmu.edu/sio/mpa/secure/export/schedule/F25_schedule.ics"
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
        <label className="mb-1 mr-4 cursor-pointer rounded-md bg-green-600 px-2 py-1 font-medium text-white">
          <a
            target="_blank"
            rel="noreferrer"
            href="https://s3.andrew.cmu.edu/sio/mpa/secure/export/schedule/F25_schedule.ics"
          >
            <span className="text-white-600 underline">SIO Export</span>
          </a>
        </label>
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col items-center w-1/4">
        <div className="space-y-2 pb-2">
          {userSchedule ? renderFinals() : renderNoSchedule()}
        </div>
        {userSchedule ? renderReuploadButton() : null}
      </div>
    </>
  );
}