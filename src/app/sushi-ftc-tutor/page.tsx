import type { Metadata } from 'next'
import { FtcTutorChat } from '@/components/ftc-tutor-chat'
import { readCurrentManual } from '@/lib/ftc/manual-store'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Sushi FTC Tutor - Rolling Robotics Education',
  description:
    'Ask FIRST Tech Challenge questions and get answers grounded in current official FIRST resources and the latest competition manual.',
}

export default async function SushiFtcTutorPage() {
  const manual = await readCurrentManual()

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-slate-50 px-3 pb-12 pt-24 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 sm:px-6 sm:pb-16 sm:pt-28">
      <div className="mx-auto max-w-5xl">
        <div className="mb-7 text-center sm:mb-10">
          <span className="inline-flex items-center rounded-full bg-primary-100 px-4 py-2 text-sm font-bold text-primary-800 dark:bg-primary-900/40 dark:text-primary-200">
            Built for FIRST Tech Challenge students
          </span>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
            Learn FTC with Team Sushi Squad
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
            A focused AI tutor that checks the current official FIRST website and
            the latest competition manual before answering.
          </p>
        </div>

        <FtcTutorChat
          initialManual={{
            season: manual.metadata.season,
            updatedAt: manual.metadata.downloadedAt,
            url: manual.metadata.source,
          }}
        />
      </div>
    </div>
  )
}
