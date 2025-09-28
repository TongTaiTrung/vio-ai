'use client'
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectLabel, SelectGroup, SelectItem } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Separator } from '@/components/ui/separator';
import { AnalyzeResult } from '@/lib/definations';
import { AlertCircle, AlertTriangle, Info, Moon, Save, Settings, Sun, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import * as XLSX from "xlsx";
import React, { ReactNode, useState } from 'react'
import { cn, downloadBase64File } from '@/lib/utils';
import { move, MoveKey } from '@/lib/moves';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

function Home() {
  const [file, setFile] = useState<File | null>();
  const [loading, setLoading] = useState(false);
  const [choosenMove, setChoosenMove] = useState<MoveKey | null>(null);
  const [results, setResults] = useState<AnalyzeResult | null>(null);
  const [preview, setPreview] = useState(false);
  const [data, setData] = useState<unknown[][]>([]);
  const {setTheme} = useTheme();

  const action = async(formData: FormData) => {
    if (!file) return;
    setResults(null);
    formData.append('file', file);
    setLoading(true);
    const res = await fetch('/api/submit', {
      method: "POST",
      body: formData,
    })

    const data = await res.json() as AnalyzeResult;
    setResults(data);
    handlePreviewExcel(data);
    setLoading(false);
  }
  const handlePreviewExcel = (data: AnalyzeResult) => {
    const cleaned = data.excel_base64.split(",")[1] || data.excel_base64;
    const binary = atob(cleaned);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; ++i) array[i] = binary.charCodeAt(i);

    const workbook = XLSX.read(array, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    setData(json as unknown[][]);
  }
  return (
    <div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget as HTMLFormElement;
          const fd = new FormData(form);
          await action(fd);
        }}
        className='min-h-screen w-full flex p-0 lg:px-96 flex-row gap-3'
      >
        <div className='mt-3 flex flex-col gap-3'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Sáng <Sun/>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Tối <Moon/>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                Hệ Thống <Settings/>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type='button' size="icon" variant={'secondary'}>
                <Info/>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className='flex flex-col'>
                <CardDescription className='flex flex-row gap-1 items-center text-destructive italic font-bold'><AlertCircle size={12}/>Lưu Ý</CardDescription>
                1. Tải lên video có góc quay trùng với góc quay của động tác
                <span>2. Tải lên video có chất lượng hình ảnh tốt (1080p trở lên)</span>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
        <Card className='w-full min-h-screen'>
          <CardHeader>
            <CardTitle>Chấm điểm động tác Vovinam</CardTitle>
            <CardDescription>Tải lên video và chọn động tác để đối chiếu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex flex-row gap-3'>
              <div className='w-full flex items-center justify-center relative'>
                <Input
                  accept='video/*'
                  required
                  type='file'
                  className='hover:cursor-pointer'
                  onChange={(e) => setFile(e.target.files?.[0])}
                />
              </div>
              <Select name='move' onValueChange={(v) => setChoosenMove(move.find(m => m.value === v) ?? null)} required>
                <SelectTrigger>
                  <SelectValue placeholder='Động tác'/>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Chọn động tác</SelectLabel>
                      {move.map((value) => <SelectItem value={value.value} key={value.value}>{value.title}</SelectItem>)}
                    </SelectGroup>
                  </SelectContent>
                </SelectTrigger>
              </Select>
            </div>
            {choosenMove && <CardDescription className='text-destructive flex flex-row items-center gap-1 mt-3'>
              Lưu ý chọn góc quay {choosenMove.angle} <AlertTriangle size={18}/>
            </CardDescription>}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading}>{loading ? "Đang chấm điểm" : "Bắt đầu chấm điểm"}{loading && <Settings className='animate-spin'/>}</Button>
          </CardFooter>
          <Separator/>
          {results && <CardContent className='grid gap-3'>
            <CardDescription className='italic'>
              {"Tổng điểm: " + results.score}
            </CardDescription>
            <Image onClick={() => setPreview(true)} src={results.graph_base64} alt="graph" width={1000} height={1000}
              className='hover:cursor-pointer rounded-2xl'
            />
          {data.length > 0 && (
          <table className="mt-4 border border-gray-400">
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className={cn("border border-gray-400 p-2 text-center font-serif", (j==0||i==0)&&"font-bold",i==4&&j==1&&"border-none")}>
                      {cell as ReactNode}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          )}
          <Button type='button' className='mt-2' onClick={() => downloadBase64File(results.excel_base64, "report.xlsx")}><Save/>Lưu báo cáo</Button>
          </CardContent>}
        </Card>
      </form>
      {preview && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 w-full min-h-screen'>
          <Button className='absolute top-5 left-5' variant={'outline'} onClick={() => setPreview(false)}>
            <X/> Quay lại
          </Button>
          <div className='relative'>
            <Image src={results?.graph_base64 ?? ''} alt="preview" width={1150} height={1150}
            className='rounded-2xl shadow-2xl'/>
          </div>
        </div>
      )}

    </div>
  )
}

export default Home