import groupBy from 'lodash.groupby';
import { Measure } from 'domain';
import { reportCriticalError, reportCriticalErrorBadConf } from '../utils/Logger';
import DateChecker from '../utils/DateChecker';
import OutputWritter from '../utils/OutputWritter';
import PowerPlant from '../domain/PowerPlant';
import PowerPlantFactory from '../domain/PowerPlantFactory';

export const CMD_GET_TOTAL_POWER = 'get-total-power';
export const CMD_GET_TOTAL_POWER_EXAMPLE = `${CMD_GET_TOTAL_POWER} --from 01-01-2020 --to 02-01-2020 --format json`;

export default class GetTotalPower {
  static async run(startingDate: string, endingDate: string, format: string): Promise<void> {
    try {
      DateChecker.checkInputDates(startingDate, endingDate);
    } catch (err) {
      reportCriticalError(err.message);
      return;
    }

    try {
      const powerPlantFactory = new PowerPlantFactory();
      const measures = await this.aggregateTotalPower(
        startingDate,
        endingDate,
        powerPlantFactory.getPowerPlants(),
      );
      OutputWritter.writeOutput(measures, format);
    } catch (err) {
      // The error must have been already logged.
    }
  }

  static async aggregateTotalPower(
    startingDate: string,
    endingDate: string,
    powerPlants: PowerPlant[],
  ): Promise<Measure[]> {
    const minTimeStep = GetTotalPower.getMinTimeStep(powerPlants);

    const allMeasures: Array<Promise<Measure[]>> = [];
    powerPlants.forEach((powerPlant) => {
      allMeasures.push(powerPlant.getMeasures(startingDate, endingDate, minTimeStep));
    });

    const allMeasuresFetched = await Promise.all(allMeasures);
    this.checkAllMeasuresHaveSameSize(powerPlants, allMeasuresFetched);
    return this.aggregateMeasuresByPower(allMeasuresFetched.flat());
  }

  static getMinTimeStep(powerPlants: PowerPlant[]): number {
    const timeSteps: number[] = [];
    powerPlants.forEach((powerPlant) => {
      timeSteps.push(powerPlant.getTimeStep());
    });
    const minTimeStep = Math.min(...timeSteps);
    if (isNaN(minTimeStep)) {
      const message = `${CMD_GET_TOTAL_POWER}: Impossible to get the minimum time step. One of the power plant time step provided is not a number.`;
      reportCriticalErrorBadConf(message);
      throw new Error(message);
    }
    return minTimeStep;
  }

  static checkAllMeasuresHaveSameSize(powerPlants: PowerPlant[], allMeasures: Measure[][]): void {
    const measureSizeReducer = (accumulator: number, measures: Measure[]) =>
      accumulator + measures.length;
    const totalNbOfMeasures = allMeasures.reduce(measureSizeReducer, 0);
    if (!(totalNbOfMeasures / powerPlants.length === allMeasures[0].length)) {
      let message = `Impossible to aggregate the measures: the number of measures returned by the power plants or smooth after correction are not the sames:\n`;
      allMeasures.forEach((powerPlantMeasures, powerPlantIndex) => {
        message += `${powerPlants[powerPlantIndex].getName()} number of measures = ${
          powerPlantMeasures.length
        }\n`;
      });
      throw new Error(message);
    }
  }

  static aggregateMeasuresByPower(measures: Measure[]): Measure[] {
    const measuresGroupedByBoundsObj = groupBy(measures, (measure: Measure) => {
      return measure.start + '-' + measure.end;
    });
    const measuresGroupedByBoundsArr: Measure[][] = Object.values(measuresGroupedByBoundsObj);

    const powerReducer = (powerAccumulator: number, measure: Measure) => {
      return powerAccumulator + measure.power;
    };

    const aggregatedMeasuresByPower = Array.from(measuresGroupedByBoundsArr, (measuresGroup) => {
      return {
        start: measuresGroup[0].start,
        end: measuresGroup[0].end,
        power: measuresGroup.reduce(powerReducer, 0),
      };
    });

    return aggregatedMeasuresByPower.sort((m1: Measure, m2: Measure) => {
      if (parseInt(m1.start) < parseInt(m2.start)) {
        return -1;
      } else if (parseInt(m1.start) > parseInt(m2.start)) {
        return 1;
      }
      return 0;
    });
  }
}
