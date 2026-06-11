import { Image, Upload } from 'lucide-react'
import { AdminCard, AdminPageHeader, UploadBox } from './AdminShell.jsx'

export default function MediaPage() {
  return (
    <>
      <AdminPageHeader eyebrow="Assets" title="Media Library" description="Manage thumbnails, logos, lecture images, and downloadable resources." />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <AdminCard>
          <Upload className="h-5 w-5 text-emerald-300" />
          <h2 className="mt-4 text-lg font-semibold text-white">Upload Media</h2>
          <div className="mt-5">
            <UploadBox label="Drop files here or choose media" />
          </div>
        </AdminCard>
        <AdminCard>
          <h2 className="text-lg font-semibold text-white">Recent Files</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {['html-thumb.png', 'awt-logo.svg', 'lab-preview.webp'].map((file) => (
              <div key={file} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                <div className="flex h-20 items-center justify-center rounded-lg bg-slate-900 text-slate-500">
                  <Image className="h-6 w-6" />
                </div>
                <p className="mt-3 truncate text-sm font-medium text-slate-300">{file}</p>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>
    </>
  )
}
