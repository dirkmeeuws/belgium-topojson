const fs = require("fs/promises");

// original topojson file
const topoFile = 'temp/belgium.topo.json';

// NIS codes
const nisFile = "source_data/REFNIS_2019.csv";

// population data
const populationFile = "source_data/bevolking_per_gemeente.csv"

// output file
const outputFile = "belgium.json";

(async function () {
  // read files
  const topojson = JSON.parse(await fs.readFile(topoFile));
  const nisData = (await fs.readFile(nisFile, "utf8")).split("\n").map(line => line.split(";"));
  const populationData = (await fs.readFile(populationFile, "utf8")).split("\n").map(line => line.trim().split(","));

  // rename gemeentes to municipalities
  topojson.objects.municipalities = topojson.objects.Gemeenten;
  topojson.objects.arrondissements = topojson.objects.ARR;
  topojson.objects.provinces = topojson.objects.Prov;
  delete topojson.objects.Gemeenten;
  delete topojson.objects.ARR;
  delete topojson.objects.Prov;

  // fix municipalities
  topojson.objects.municipalities.geometries.map(muni => {
    // manually fix the spelling in the original topojson file
    if (muni.properties?.NAME_4 === "Sint-Joost-ten-Noode") muni.properties.NAME_4 = "Sint-Joost-ten-Node";
    if (muni.properties?.NAME_4 === "MOERBEKE-WAAS") muni.properties.NAME_4 = "Moerbeke";
    if (muni.properties?.NAME_4 === "Écaussinnes") muni.properties.NAME_4 = "Ecaussinnes";
    if (muni.properties?.NAME_4 === "Celles-lez-Tournai") muni.properties.NAME_4 = "Celles";
    if (muni.properties?.NAME_4 === "Blegny") muni.properties.NAME_4 = "Blégny";
    if (muni.properties?.NAME_4 === "Fernlemont") muni.properties.NAME_4 = "Fernelmont";
    if (muni.properties?.NAME_2 === "Vlaams Brabant") muni.properties.NAME_2 = "Vlaams-Brabant";
    if (muni.properties?.NAME_2 === "Brabant Wallon") muni.properties.NAME_2 = "Waals-Brabant";
    if (muni.properties?.NAME_2 === "Hainaut") muni.properties.NAME_2 = "Henegouwen";
    if (muni.properties?.NAME_2 === "Luxembourg") muni.properties.NAME_2 = "Luxemburg";
    if (muni.properties?.NAME_3 === "Moeskroen") muni.properties.NAME_3 = "Tournai-Mouscron";
    if (muni.properties?.NAME_3 === "Tournai") muni.properties.NAME_3 = "Tournai-Mouscron";
    if (muni.properties?.NAME_3 === "Brussel") muni.properties.NAME_3 = "Brussel Hoofdstad";


    // set the region
    if (muni.properties?.NAME_1 === "Bruxelles") {
      muni.properties.reg_nis = "04000";
      muni.properties.reg_nl = "Brussels Hoofdstedelijk Gewest"
      muni.properties.reg_fr = "Région de Bruxelles-Capitale"
    } else if (muni.properties?.NAME_1 === "Wallonie") {
      muni.properties.reg_nis = "03000";
      muni.properties.reg_nl = "Waals Gewest"
      muni.properties.reg_fr = "Région Walonne"
    } else if (muni.properties?.NAME_1 === "Vlaanderen") {
      muni.properties.reg_nis = "02000";
      muni.properties.reg_nl = "Vlaams Gewest"
      muni.properties.reg_fr = "Région Flamande"
    }

    // merge the official names and nis code
    let name_nl = muni.properties?.NAME_4?.toLowerCase();
    let name_fr = muni.properties?.NAME_4?.toLowerCase();
    let row = nisData.find(row => row[4].toLowerCase() == name_nl) || nisData.find(row => row[1].toLowerCase() == name_fr);
    if (row) {
      muni.properties.nis = row[0];
      muni.properties.name_fr = row[1];
      muni.properties.name_nl = row[4];
    }

    // merge the provinces
    name_nl = "provincie " + muni.properties?.NAME_2?.toLowerCase();
    name_fr = "province de " + muni.properties?.NAME_2?.toLowerCase();
    row = nisData.find(row => row[4].toLowerCase() == name_nl) || nisData.find(row => row[1].toLowerCase() == name_fr);
    if (row) {
      muni.properties.prov_nis = row[0];
      muni.properties.prov_fr = row[1];
      muni.properties.prov_nl = row[4];
    }

    // merge the arrondissements
    name_nl = "arrondissement " + muni.properties?.NAME_3?.toLowerCase();
    name_fr = "arrondissement de " + muni.properties?.NAME_3?.toLowerCase();
    let name_fr2 = "arrondissement d'" + muni.properties?.NAME_3?.toLowerCase();
    row = nisData.find(row => row[4].toLowerCase() == name_nl) || nisData.find(row => row[1].toLowerCase() == name_fr) || nisData.find(row => row[1].toLowerCase() == name_fr2);
    if (!row) { console.log(name_nl) }
    if (row) {
      muni.properties.arr_nis = row[0];
      muni.properties.arr_fr = row[1];
      muni.properties.arr_nl = row[4];
    }

    // merge population data
    row = populationData.find(row => row[0] === muni.properties.nis);
    if (row) {
      muni.properties.population = +row[4];
    }

    // remove unused properties
    delete muni.properties.ISO;
    delete muni.properties.ID_0;
    delete muni.properties.ID_1;
    delete muni.properties.ID_2;
    delete muni.properties.ID_3;
    delete muni.properties.ID_4;
    delete muni.properties.NAME_0;
    delete muni.properties.NAME_1;
    delete muni.properties.NAME_2;
    delete muni.properties.NAME_3;
    delete muni.properties.NAME_4;
    delete muni.properties.VARNAME_4;
    delete muni.properties.TYPE_4;
    delete muni.properties.ENGTYPE_4;
    delete muni.properties.NAME_4_NEW;
    delete muni.properties["NAME_3 - NEW"];
    delete muni.properties["NAME_2 - New"];
  });

  await fs.writeFile(outputFile, JSON.stringify(topojson));
}());