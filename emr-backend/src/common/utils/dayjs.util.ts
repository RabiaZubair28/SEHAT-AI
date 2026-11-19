import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';

// dayjs is CommonJS without a `default` export, so a plain default import
// breaks at runtime here. Import dayjs from this module instead: it registers
// the plugins once and exposes a real default export.
dayjs.extend(utc);

export default dayjs;
