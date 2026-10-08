type IconName = 'left' | 'right' | 'chevron-left' | 'chevron-right' | 'plus' | 'check' | 'clock' | 'refresh' | 'download';

const paths: Record<IconName, string> = {
  left: 'M19 12H5m7-7-7 7 7 7',
  right: 'M5 12h14m-7-7 7 7-7 7',
  'chevron-left': 'm15 6-6 6 6 6',
  'chevron-right': 'm9 6 6 6-6 6',
  plus: 'M12 5v14M5 12h14',
  check: 'm5 12 4 4L19 6',
  clock: 'M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  refresh: 'M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 3M4 15l2 3a7 7 0 0 0 12-1',
  download: 'M12 3v12m-5-5 5 5 5-5M5 17v4h14v-4',
};

export default function UiIcon({ name }: { name: IconName }) {
  return <svg className="h30-ui-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name]} /></svg>;
}
