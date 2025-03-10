"use client"

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table"


import React from "react"
import { Input } from "./ui/input"
import DataTable from "./datatable"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function SearchTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        []
        )
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
        columnFilters,
    },
  })

  

  return (
    <div className="flex flex-col max-w-screen">
    <div className="self-start w-3/4 pb-2">
        <Input
          placeholder="Filter by course"
          value={(table.getColumn("course_and_section")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("course_and_section")?.setFilterValue(event.target.value.split(", "))
          }
        />
    </div>
      <DataTable table={table} columns={columns} />
    </div>
  )
}
