import PowerPlantBarnsley from '../domain/PowerPlantBarnsley';
import PowerPlantHawes from '../domain/PowerPlantHawes';
import PowerPlantHounslow from '../domain/PowerPlantHounslow';
import PowerPlant from './PowerPlant';

export default class PowerPlantFactory {
  private powerPlants: PowerPlant[] = [];

  // If we need to add a new power plant:
  // 1. Add a new class which inherits from PowerPlant.
  // 2. Add its corresponding environment variable in the .env.example Only
  //    the time step and the name are required by the PowerPlant class.
  // 3. Instantiate it here. The generic algorithm will take care of
  //    aggregating the data from all the power plants.
  getPowerPlants(): PowerPlant[] {
    if (this.powerPlants.length === 0) {
      this.powerPlants = [
        new PowerPlantHawes(),
        new PowerPlantBarnsley(),
        new PowerPlantHounslow(),
      ];
    }
    return this.powerPlants;
  }
}
