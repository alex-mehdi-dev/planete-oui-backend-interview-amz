import { Measure } from 'domain';
import PowerPlant from './PowerPlant';
import { reportCriticalErrorBadConf } from '../utils/Logger';
import { fetch } from '../utils/Network';

interface BarnselyMeasure {
  start_time: string;
  end_time: string;
  value: number;
}

export default class PowerPlantBarnsley extends PowerPlant {
  constructor() {
    super(POWER_PLANT_BARNSLEY_NAME, POWER_PLANT_BARNSLEY_TIME_STEP);
  }

  async getRawMeasures(staringDate: string, endingDate: string): Promise<Measure[]> {
    const response = await fetch.request<BarnselyMeasure[]>({
      url: POWER_PLANT_BARNSLEY_API_URL,
      params: {
        from: staringDate,
        to: endingDate,
      },
    });

    return PowerPlantBarnsley.transformBarnselyMeasureToMeasure(response.data);
  }

  static transformBarnselyMeasureToMeasure(barnselyMeasures: BarnselyMeasure[]): Measure[] {
    return barnselyMeasures.map(
      (barnselyMeasure) =>
        ({
          start: barnselyMeasure.start_time,
          end: barnselyMeasure.end_time,
          power: barnselyMeasure.value,
        } as Measure),
    );
  }
}

function checkEnvironmentVariables() {
  if (!process.env.POWER_PLANT_BARNSLEY_NAME) {
    const message = `Invalid environment variable POWER_PLANT_BARNSLEY_NAME: value required.`;
    reportCriticalErrorBadConf(message);
    throw new Error(message);
  }
  if (!process.env.POWER_PLANT_BARNSLEY_API_URL) {
    const message = `Invalid environment variable POWER_PLANT_BARNSLEY_API_URL: value required.`;
    reportCriticalErrorBadConf(message);
    throw new Error(message);
  }
  if (!process.env.POWER_PLANT_BARNSLEY_TIME_STEP) {
    const message = `Invalid environment variable POWER_PLANT_BARNSLEY_TIME_STEP: value required.`;
    reportCriticalErrorBadConf(message);
    throw new Error(message);
  }
  if (
    isNaN(parseInt(process.env.POWER_PLANT_BARNSLEY_TIME_STEP)) ||
    parseInt(process.env.POWER_PLANT_BARNSLEY_TIME_STEP) < 0
  ) {
    const message = `Invalid environment variable POWER_PLANT_BARNSLEY_TIME_STEP (value = '${process.env.POWER_PLANT_BARNSLEY_TIME_STEP}'): the value must be a postive number.`;
    reportCriticalErrorBadConf(message);
    throw new Error(message);
  }
}

checkEnvironmentVariables();
const POWER_PLANT_BARNSLEY_NAME = process.env.POWER_PLANT_BARNSLEY_NAME
  ? process.env.POWER_PLANT_BARNSLEY_NAME
  : '';
const POWER_PLANT_BARNSLEY_API_URL = process.env.POWER_PLANT_BARNSLEY_API_URL
  ? process.env.POWER_PLANT_BARNSLEY_API_URL
  : '';
const POWER_PLANT_BARNSLEY_TIME_STEP = process.env.POWER_PLANT_BARNSLEY_TIME_STEP
  ? parseInt(process.env.POWER_PLANT_BARNSLEY_TIME_STEP)
  : 0;
