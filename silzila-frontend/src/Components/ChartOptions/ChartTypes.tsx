// This component list all different charts that a user can create
// It also handles
// 	- the differences in dropzones for each specific graphs along,
// 	- moving table fields into appropriate dropzones for each specific chart type

import React from "react";
import { connect } from "react-redux";

import "./ChartIconStyles.css";
import multiBarIcon from "../../assets/new_bar.svg";
import horizontalBar from "../../assets/new_horizondalBar.svg";
import stackedBarIcon from "../../assets/new_stackedBar.svg";
import horizontalStackedBar from "../../assets/new_horizondalStackedBar.svg";
import lineChartIcon from "../../assets/new_line.svg";
import areaChartIcon from "../../assets/new_area.svg";
import pieChartIcon from "../../assets/new_pie.svg";
import donutChartIcon from "../../assets/new_doughnut.svg";
import scatterPlotIcon from "../../assets/new_scatterPlot.svg";
import funnelChartIcon from "../../assets/new_Funnel.svg";
import gaugeChartIcon from "../../assets/new_gauge.svg";
import heatMapIcon from "../../assets/new_heatMap.svg";
import CrossTabIcon from "../../assets/new_crossTab.svg";
import roseChartIcon from "../../assets/new_rose.svg";
import simpleCard from "../../assets/Simple_Card_icon.svg";
// import geoChartIcon from "../../assets/geoMap.svg";
import filledMapIcon from "../../assets/map_filled.svg";
import bubbleMapIcon from "../../assets/map_dot.svg";
import stackedAreaChartIcon from "../../assets/new_areaStacked.svg";
import calendarChartIcon from "../../assets/new_calendar.svg";
import "./ChartOptions.css";
import boxPlotIcon from "../../assets/new_boxPlot.svg";
import TreeMapIcon from "../../assets/new_treeMap.svg";
import TableIcon from "../../assets/table.svg";
import TextEditorIcon from "../../assets/Rich_Text_icon.svg";
import Sankey from "../../assets/new_sankey.svg";
import { Dispatch } from "redux";
import {
  canReUseData,
  changeChartTypeAndAxes,
  editChartPropItem,
  enableOverrideForUIDAction,
} from "../../redux/ChartPoperties/ChartPropertiesActions";
import { updateChartData } from "../../redux/ChartPoperties/ChartControlsActions";
import {
  actionsToAddTileForRichText,
  actionsToUpdateSelectedTile,
} from "../../redux/TabTile/TabTileActionsAndMultipleDispatches";
import ChartsInfo from "../ChartAxes/ChartsInfo2";
import { addChartFilterTabTileName } from "../../redux/ChartFilterGroup/ChartFilterGroupStateActions";
import Logger from "../../Logger";
import { fieldName } from "../CommonFunctions/CommonFunctions";

export const chartTypes = [
  { name: "crossTab", icon: CrossTabIcon, value: " Cross Tab" },
  { name: "pie", icon: pieChartIcon, value: " Pie Chart" },
  { name: "donut", icon: donutChartIcon, value: " Donut Chart" },
  { name: "rose", icon: roseChartIcon, value: "Rose Chart" },
  { name: "multibar", icon: multiBarIcon, value: "Multi Bar" },
  { name: "horizontalBar", icon: horizontalBar, value: "Horizontal Bar" },
  { name: "stackedBar", icon: stackedBarIcon, value: "Stacked Bar" },
  {
    name: "horizontalStacked",
    icon: horizontalStackedBar,
    value: "Horizontal Stacked Bar",
  },

  { name: "line", icon: lineChartIcon, value: "Line Chart" },
  { name: "area", icon: areaChartIcon, value: "Area Chart" },
  {
    name: "stackedArea",
    icon: stackedAreaChartIcon,
    value: "Stacked Area Chart",
  },
  { name: "scatterPlot", icon: scatterPlotIcon, value: " Scatter Plot" },
  { name: "gauge", icon: gaugeChartIcon, value: "Gauge Chart" },
  { name: "funnel", icon: funnelChartIcon, value: "Funnel Chart" },
  { name: "heatmap", icon: heatMapIcon, value: "Heat Map" },
  { name: "treeMap", icon: TreeMapIcon, value: "Tree Map" },
  { name: "filledMap", icon: filledMapIcon, value: "Filled Map" },
  { name: "bubbleMap", icon: bubbleMapIcon, value: "Bubble Map" },
  { name: "calendar", icon: calendarChartIcon, value: "Calendar Chart" },
  { name: "boxPlot", icon: boxPlotIcon, value: "Box Plot Chart" },
  { name: "sankey", icon: Sankey, value: "Sankey Chart" },
  { name: "richText", icon: TextEditorIcon, value: "Rich Text" },
  { name: "simplecard", icon: simpleCard, value: "Simple Card" },
  { name: "table", icon: TableIcon, value: "Table" },
];
//testing switch
const ChartTypes = ({
  //props
  propKey,

  //state
  chartProp,
  chartGroup,
  tabState,
  tabTileProps,
  chartControls,

  //dispatch
  updateChartTypeAndAxes,
  addChartFilterTabTileName,
  keepOldData,
  updateChartData,
  addTile,
  selectTile,
  updateQueryParam,
  enableOverrideForUIDAction,
}: any) => {
  var selectedChart = chartProp.properties[propKey].chartType;

  const getFieldsToChartAllowedNumbers = (
    chartName: string,
    chartAxesIndex: number,
    arr1: any,
    arr2?: any
  ) => {
    let allowedNumbers =
      ChartsInfo[chartName].dropZones[chartAxesIndex].allowedNumbers ?? 1;
    if (arr1 && arr1.length > 0) {
      if (allowedNumbers > arr1.length) {
        if (arr2 && arr2.length > 0) {
          return [...arr1, ...arr2].slice(0, allowedNumbers);
        } else {
          return arr1;
        }
      } else {
        if (allowedNumbers === arr1.length) {
          return arr1;
        } else {
          return arr1.slice(0, allowedNumbers);
        }
      }
    } else if (arr2 && arr2.length > 0) {
      return arr2.slice(0, allowedNumbers);
    } else {
      return [];
    }
  };

  const clearOverRideOnChartChange = (
    newChart: string,
    oldChart: string,
    newChartAxes: any
  ) => {
    let _isNewChart: boolean = [
      "multibar",
      "stackedBar",
      "horizontalBar",
      "horizontalStacked",
      "line",
      "area",
      "stackedArea",
      "pie",
      "donut",
      "rose",
    ].includes(newChart);

    let _oldChart: boolean = [
      "multibar",
      "stackedBar",
      "horizontalBar",
      "horizontalStacked",
      "line",
      "area",
      "stackedArea",
      "pie",
      "donut",
      "rose",
    ].includes(oldChart);

    if (!_isNewChart || !_oldChart) {
      let axes: any[] = newChartAxes.filter(
        (axes: any) => axes.name !== "Filter"
      );

      [...axes].forEach((axis: any, _bIndex: number) => {
        [...axis.fields].forEach((field: any, idx: number) => {
          let _field = JSON.parse(JSON.stringify(field));
          _field.override = null;
          updateQueryParam(propKey, _bIndex + 1, idx, _field, "chartAxes");
          enableOverrideForUIDAction(propKey, "");
        });
      });
    }
  };

  //TODO:New Function for allowed numbers

  const IsOldChartFieldsCountIsGreater = (
    newChartName: string,
    chartAxesIndex: number
  ) => {
    let oldChartAxesFieldsCount =
      chartProp.properties[propKey].chartAxes[chartAxesIndex]?.fields?.length;
    //let oldAllowedNumbers = ChartsInfo[oldChartName].dropZones[chartAxesIndex].allowedNumbers;
    let newAllowedNumbers =
      ChartsInfo[newChartName].dropZones[chartAxesIndex].allowedNumbers;

    return Number(oldChartAxesFieldsCount) > Number(newAllowedNumbers);
  };

  const UpdateChartDataWithNewChartAxes = (
    oldAxes: any,
    newAxes: any,
    index: number
  ) => {
    let chartData: any = [],
      keys: any = [],
      keysToRemove: any = [];

    if (
      chartControls.properties[propKey].chartData &&
      chartControls.properties[propKey].chartData.length > 0
    ) {
      chartData = JSON.parse(
        JSON.stringify(chartControls.properties[propKey].chartData)
      );
    }

    newAxes[index].fields.forEach((newField: any) => {
      keys.push(newField.fieldname);
    });

    oldAxes[index].fields.forEach((field: any) => {
      if (!keys.includes(field.fieldname)) {
        keysToRemove.push(fieldName(field));
      }
    });

    chartData.forEach((data: any) => {
      keysToRemove.forEach((key: string) => {
        delete data[key];
      });
    });

    updateChartData(propKey, chartData);
  };

  const switchAxesForCharts = (oldChart: string, newChart: string) => {
    var oldChartAxes = JSON.parse(
      JSON.stringify(chartProp.properties[propKey].chartAxes)
    );
    var newChartAxes: any = [];
    for (let i = 0; i < ChartsInfo[newChart].dropZones.length; i++) {
      newChartAxes.push({
        name: ChartsInfo[newChart].dropZones[i].name,
        fields: [],
      });
    }

    switch (oldChart) {
      case "multibar":
      case "stackedBar":
      case "horizontalBar":
      case "horizontalStacked":
      case "line":
      case "area":
      case "stackedArea":
      case "treeMap":
      case "filledMap":
      case "table":
      case "sankey":
        if (
          [
            "multibar",
            "stackedBar",
            "horizontalBar",
            "horizontalStacked",
            "line",
            "area",
            "filledMap",
            "stackedArea",
            "treeMap",
            "sankey",
            "table",
          ].includes(newChart)
        ) {
          if (
            IsOldChartFieldsCountIsGreater(newChart, 1) ||
            IsOldChartFieldsCountIsGreater(newChart, 2)
          ) {
            if (IsOldChartFieldsCountIsGreater(newChart, 1)) {
              oldChartAxes[1].fields = getFieldsToChartAllowedNumbers(
                newChart,
                1,
                oldChartAxes[1].fields
              );

              keepOldData(propKey, false);
            }

            if (IsOldChartFieldsCountIsGreater(newChart, 2)) {
              newChartAxes[2].fields = getFieldsToChartAllowedNumbers(
                newChart,
                2,
                oldChartAxes[2].fields
              );

              UpdateChartDataWithNewChartAxes(oldChartAxes, newChartAxes, 2);
              oldChartAxes[2].fields = newChartAxes[2].fields;
              keepOldData(propKey, true);
            }

            return oldChartAxes;
          } else {
            keepOldData(propKey, true);
            return oldChartAxes;
          }
        }

        if (newChart === "calendar") {
          if (oldChartAxes[1].fields.length > 0) {
            if (
              oldChartAxes[1].fields[0].dataType === "date" ||
              oldChartAxes[1].fields[0].dataType === "timestamp"
            ) {
              keepOldData(propKey, false);
              updateChartData(propKey, "");

              newChartAxes[0].fields = oldChartAxes[0].fields;
              if (oldChartAxes[1].fields[0].timeGrain === "date") {
                newChartAxes[1].fields.push(oldChartAxes[1].fields[0]);
              } else {
                //In case of Calendar chart timegrain should be date
                newChartAxes[1].fields = [
                  {
                    dataType: oldChartAxes[1].fields[0].dataType,
                    displayname:
                      "date of " + oldChartAxes[1].fields[0].fieldname, // timegrain changed to date so change display name
                    fieldname: oldChartAxes[1].fields[0].fieldname,
                    tableId: oldChartAxes[1].fields[0].tableId,
                    uId: oldChartAxes[1].fields[0].uId,
                    timeGrain: "date",
                  },
                ];
              }
              if (oldChartAxes[2].fields.length > 0)
                newChartAxes[2].fields.push(oldChartAxes[2].fields[0]);
              return newChartAxes;
            } else {
              keepOldData(propKey, false);

              newChartAxes[1].fields = [];
              if (oldChartAxes[2].fields.length > 0)
                newChartAxes[2].fields.push(oldChartAxes[2].fields[0]);

              return newChartAxes;
            }
          } else {
            keepOldData(propKey, false);
            updateChartData(propKey, "");

            newChartAxes[0].fields = oldChartAxes[0].fields;
            newChartAxes[1].fields = [];
            if (oldChartAxes[2].fields.length > 0)
              newChartAxes[2].fields.push(oldChartAxes[2].fields[0]);
            return newChartAxes;
          }
        }

        if (newChart === "pie" || newChart === "donut" || newChart === "rose") {
          keepOldData(propKey, false);

          newChartAxes[0].fields = oldChartAxes[0].fields; //Filter

          if (oldChartAxes[1].fields.length > 0)
            newChartAxes[1].fields.push(oldChartAxes[1].fields[0]); //Dimension	allowedNumbers: 1,

          newChartAxes[2].fields = getFieldsToChartAllowedNumbers(
            newChart,
            2,
            oldChartAxes[2].fields
          ); //Measure

          return newChartAxes;
        }

        if (newChart === "scatterPlot") {
          keepOldData(propKey, false);

          // Map Category to Category
          if (oldChartAxes[1].fields.length > 0)
            newChartAxes[1].fields = getFieldsToChartAllowedNumbers(
              newChart,
              1,
              oldChartAxes[1].fields
            );

          // Map Value to X and Y columns if there are more than one values
          if (oldChartAxes[2].fields.length > 0) {
            if (oldChartAxes[2].fields.length > 1) {
              newChartAxes[3].fields.push(oldChartAxes[2].fields.shift());
              newChartAxes[2].fields.push(oldChartAxes[2].fields.shift());
            } else {
              newChartAxes[3].fields = oldChartAxes[2].fields;
            }
          }

          // Map filter to Filter
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          return newChartAxes;
        }

        if (newChart === "funnel" || newChart === "simplecard") {
          //name: "Measure", allowedNumbers: 12,
          keepOldData(propKey, false);

          if (oldChartAxes[2].fields.length > 0)
            // newChartAxes[1].fields = oldChartAxes[2].fields; // this will work
            newChartAxes[1].fields = getFieldsToChartAllowedNumbers(
              newChart,
              1,
              oldChartAxes[2].fields
            );

          // Map filter to Filter
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          return newChartAxes;
        }

        if (newChart === "gauge" || newChart === "richText") {
          keepOldData(propKey, false);
          if (oldChartAxes[2].fields.length > 0)
            newChartAxes[1].fields.push(oldChartAxes[2].fields[0]);

          // Map filter to Filter
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          return newChartAxes;
        }

        if (newChart === "heatmap" || newChart === "boxPlot") {
          keepOldData(propKey, false);

          if (oldChartAxes[1].fields.length > 0) {
            if (oldChartAxes[1].fields.length > 1) {
              newChartAxes[1].fields.push(oldChartAxes[1].fields[0]);
              newChartAxes[2].fields.push(oldChartAxes[1].fields[1]);
            } else {
              newChartAxes[1].fields = oldChartAxes[1].fields;
            }
          }

          if (oldChartAxes[2].fields.length > 0) {
            newChartAxes[3].fields.push(oldChartAxes[2].fields[0]);
          }

          // Map filter to Filter
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          return newChartAxes;
        }

        if (newChart === "crossTab") {
          keepOldData(propKey, false);
          if (oldChartAxes[1].fields.length > 0) {
            newChartAxes[1].fields = oldChartAxes[1].fields;
          }

          if (oldChartAxes[2].fields.length > 0) {
            newChartAxes[3].fields = oldChartAxes[2].fields;
          }

          // Map filter to Filter
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          return newChartAxes;
        }

        if (newChart === "bubbleMap") {
          keepOldData(propKey, false);
          if (oldChartAxes[1].fields.length > 0) {
            if (oldChartAxes[1].fields.length > 1) {
              newChartAxes[2].fields.push(oldChartAxes[1].fields[0]);
              newChartAxes[1].fields.push(oldChartAxes[1].fields[1]);
            } else {
              newChartAxes[2].fields = oldChartAxes[1].fields;
            }
          }

          if (oldChartAxes[2].fields.length > 0) {
            newChartAxes[3].fields.push(oldChartAxes[2].fields[0]);
          }

          // Map filter to Filter
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          return newChartAxes;
        }
        break;

      case "calendar":
        if (newChart === "calendar") {
          return oldChartAxes;
        }

        if (
          [
            "multibar",
            "stackedBar",
            "horizontalBar",
            "horizontalStacked",
            "line",
            "area",
            "stackedArea",
            "treeMap",
            "sankey",
            "table",
          ].includes(newChart)
        ) {
          keepOldData(propKey, true);

          return oldChartAxes;
        }

        if (newChart === "pie" || newChart === "donut" || newChart === "rose") {
          keepOldData(propKey, false);

          newChartAxes[0].fields = oldChartAxes[0].fields; //Filter

          if (oldChartAxes[1].fields.length > 0)
            newChartAxes[1].fields.push(oldChartAxes[1].fields[0]); //Dimension	allowedNumbers: 1,

          newChartAxes[2].fields = getFieldsToChartAllowedNumbers(
            newChart,
            2,
            oldChartAxes[2].fields
          ); //Measure

          return newChartAxes;
        }

        if (newChart === "scatterPlot") {
          keepOldData(propKey, false);

          // Map Category to Category
          if (oldChartAxes[1].fields.length > 0)
            newChartAxes[1].fields = getFieldsToChartAllowedNumbers(
              newChart,
              1,
              oldChartAxes[1].fields
            );

          // Map Value to X and Y columns if there are more than one values
          if (oldChartAxes[2].fields.length > 0) {
            if (oldChartAxes[2].fields.length > 1) {
              newChartAxes[3].fields.push(oldChartAxes[2].fields.shift());
              newChartAxes[2].fields.push(oldChartAxes[2].fields.shift());
            } else {
              newChartAxes[3].fields = oldChartAxes[2].fields;
            }
          }

          // Map filter to Filter
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          return newChartAxes;
        }

        if (newChart === "funnel" || newChart === "simplecard") {
          keepOldData(propKey, false);

          if (oldChartAxes[2].fields.length > 0)
            newChartAxes[1].fields = oldChartAxes[2].fields;
          // Map filter to Filter
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          return newChartAxes;
        }

        if (newChart === "gauge" || newChart === "richText") {
          keepOldData(propKey, false);
          if (oldChartAxes[2].fields.length > 0)
            newChartAxes[1].fields.push(oldChartAxes[2].fields[0]);

          // Map filter to Filter
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          return newChartAxes;
        }

        if (
          newChart === "heatmap" ||
          newChart === "boxPlot" ||
          newChart === "crossTab"
        ) {
          keepOldData(propKey, false);
          if (oldChartAxes[1].fields.length > 0) {
            newChartAxes[1].fields.push(oldChartAxes[1].fields[0]);
          }

          if (oldChartAxes[2].fields.length > 0) {
            newChartAxes[3].fields.push(oldChartAxes[2].fields[0]);
          }

          // Map filter to Filter
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          return newChartAxes;
        }

        if (newChart === "filledMap") {
          keepOldData(propKey, false);

          if (oldChartAxes[2].fields.length > 0) {
            newChartAxes[2].fields = oldChartAxes[2].fields;
          }

          // Map filter to Filter
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          return newChartAxes;
        }

        if (newChart === "bubbleMap") {
          keepOldData(propKey, false);

          if (oldChartAxes[2].fields.length > 0) {
            newChartAxes[3].fields = oldChartAxes[2].fields;
          }

          // Map filter to Filter
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          return newChartAxes;
        }
        break;

      case "pie":
      case "donut":
      case "rose":
        if (
          [
            "multibar",
            "stackedBar",
            "horizontalBar",
            "horizontalStacked",
            "line",
            "area",
            "pie",
            "table",
            "donut",
            "rose",
            "stackedArea",
            "treeMap",
            "filledMap",
            "sankey",
          ].includes(newChart)
        ) {
          if (
            IsOldChartFieldsCountIsGreater(newChart, 1) ||
            IsOldChartFieldsCountIsGreater(newChart, 2)
          ) {
            if (IsOldChartFieldsCountIsGreater(newChart, 1)) {
              oldChartAxes[1].fields = getFieldsToChartAllowedNumbers(
                newChart,
                1,
                oldChartAxes[1].fields
              );

              keepOldData(propKey, false);
            }

            if (IsOldChartFieldsCountIsGreater(newChart, 2)) {
              newChartAxes[2].fields = getFieldsToChartAllowedNumbers(
                newChart,
                2,
                oldChartAxes[2].fields
              );

              UpdateChartDataWithNewChartAxes(oldChartAxes, newChartAxes, 2);
              oldChartAxes[2].fields = newChartAxes[2].fields;
              keepOldData(propKey, true);
            }

            return oldChartAxes;
          } else {
            keepOldData(propKey, true);
            return oldChartAxes;
          }
        }

        if (newChart === "calendar") {
          if (oldChartAxes[1].fields.length > 0) {
            if (
              oldChartAxes[1].fields[0].dataType === "date" ||
              oldChartAxes[1].fields[0].dataType === "timestamp"
            ) {
              if (oldChartAxes[1].fields[0].timeGrain === "date") {
                keepOldData(propKey, true);
                return oldChartAxes;
              } else {
                //In case of Calendar chart timegrain should be date
                keepOldData(propKey, false);
                updateChartData(propKey, "");

                newChartAxes[0].fields = oldChartAxes[0].fields;
                newChartAxes[1].fields = [
                  {
                    dataType: oldChartAxes[1].fields[0].dataType,
                    displayname:
                      "date of " + oldChartAxes[1].fields[0].fieldname, // timegrain changed to date so change display name
                    fieldname: oldChartAxes[1].fields[0].fieldname,
                    tableId: oldChartAxes[1].fields[0].tableId,
                    uId: oldChartAxes[1].fields[0].uId,
                    timeGrain: "date",
                  },
                ];
                if (oldChartAxes[2].fields.length > 0)
                  newChartAxes[2].fields = oldChartAxes[2].fields;

                return newChartAxes;
              }
            } else {
              keepOldData(propKey, false);

              newChartAxes[1].fields = [];
              if (oldChartAxes[2].fields.length > 0)
                newChartAxes[2].fields.push(oldChartAxes[2].fields[0]);

              return newChartAxes;
            }
          } else {
            keepOldData(propKey, true);
            return oldChartAxes;
          }
        }

        if (newChart === "scatterPlot") {
          keepOldData(propKey, false);

          // Map Category to Category
          if (oldChartAxes[1].fields.length > 0)
            newChartAxes[1].fields = getFieldsToChartAllowedNumbers(
              newChart,
              1,
              oldChartAxes[1].fields
            );

          // Map Value to X and Y columns if there are more than one values
          if (oldChartAxes[2].fields.length > 0) {
            if (oldChartAxes[2].fields.length > 1) {
              newChartAxes[3].fields.push(oldChartAxes[2].fields.shift());
              newChartAxes[2].fields.push(oldChartAxes[2].fields.shift());
            } else {
              newChartAxes[3].fields = oldChartAxes[2].fields;
            }
          }

          // Map filter to Filter
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          return newChartAxes;
        }

        if (
          newChart === "gauge" ||
          newChart === "richText" ||
          newChart === "funnel" ||
          newChart === "simplecard"
        ) {
          keepOldData(propKey, false);
          if (oldChartAxes[2].fields.length > 0)
            newChartAxes[1].fields.push(oldChartAxes[2].fields[0]);

          // Map filter to Filter
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          return newChartAxes;
        }

        if (
          newChart === "crossTab" ||
          newChart === "boxPlot" ||
          newChart === "heatmap"
        ) {
          keepOldData(propKey, false);
          if (oldChartAxes[1].fields.length > 0) {
            newChartAxes[1].fields.push(oldChartAxes[1].fields[0]);
          }

          if (oldChartAxes[2].fields.length > 0) {
            newChartAxes[3].fields.push(oldChartAxes[2].fields[0]);
          }

          // Map filter to Filter
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          return newChartAxes;
        }

        if (newChart === "bubbleMap") {
          keepOldData(propKey, false);
          if (oldChartAxes[1].fields.length > 0) {
            newChartAxes[2].fields = oldChartAxes[1].fields;
          }

          if (oldChartAxes[2].fields.length > 0) {
            newChartAxes[3].fields = oldChartAxes[2].fields;
          }

          // Map filter to Filter
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          return newChartAxes;
        }
        break;

      case "scatterPlot":
        if (newChart === "scatterPlot") {
          return oldChartAxes;
        }

        if (
          [
            "multibar",
            "stackedBar",
            "horizontalBar",
            "horizontalStacked",
            "line",
            "area",
            "pie",
            "table",
            "donut",
            "rose",
            "stackedArea",
            "treeMap",
            "filledMap",
            "sankey",
          ].includes(newChart)
        ) {
          keepOldData(propKey, true);
          // Map Category to Category
          if (oldChartAxes[1].fields.length > 0)
            newChartAxes[1].fields = oldChartAxes[1].fields;

          // Map X & Y to Value
          newChartAxes[2].fields = getFieldsToChartAllowedNumbers(
            newChart,
            2,
            oldChartAxes[2].fields,
            oldChartAxes[3].fields
          );

          // Map filter to Filter
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;
          return newChartAxes;
        }

        if (newChart === "calendar") {
          if (oldChartAxes[1].fields.length > 0) {
            if (
              oldChartAxes[1].fields[0].dataType === "date" ||
              oldChartAxes[1].fields[0].dataType === "timestamp"
            ) {
              keepOldData(propKey, false);
              updateChartData(propKey, "");

              newChartAxes[0].fields = oldChartAxes[0].fields;
              if (oldChartAxes[1].fields[0].timeGrain === "date") {
                newChartAxes[1].fields = oldChartAxes[1].fields;
              } else {
                //In case of Calendar chart timegrain should be date
                newChartAxes[1].fields = [
                  {
                    dataType: oldChartAxes[1].fields[0].dataType,
                    displayname:
                      "date of " + oldChartAxes[1].fields[0].fieldname, // timegrain changed to date so change display name
                    fieldname: oldChartAxes[1].fields[0].fieldname,
                    tableId: oldChartAxes[1].fields[0].tableId,
                    uId: oldChartAxes[1].fields[0].uId,
                    timeGrain: "date",
                  },
                ];
              }
              if (oldChartAxes[3].fields.length > 0)
                newChartAxes[2].fields = oldChartAxes[3].fields;
              else if (oldChartAxes[2].fields.length > 0)
                newChartAxes[2].fields.push(oldChartAxes[2].fields[0]);
              return newChartAxes;
            } else {
              keepOldData(propKey, false);

              newChartAxes[1].fields = [];
              if (oldChartAxes[3].fields.length > 0)
                newChartAxes[2].fields.push(oldChartAxes[3].fields[0]);
              else if (oldChartAxes[2].fields.length > 0)
                newChartAxes[2].fields.push(oldChartAxes[2].fields[0]);

              return newChartAxes;
            }
          } else {
            keepOldData(propKey, false);
            updateChartData(propKey, "");

            newChartAxes[0].fields = oldChartAxes[0].fields;
            newChartAxes[1].fields = oldChartAxes[1].fields;
            if (oldChartAxes[3].fields.length > 0)
              newChartAxes[2].fields.push(oldChartAxes[3].fields[0]);
            else if (oldChartAxes[2].fields.length > 0)
              newChartAxes[2].fields.push(oldChartAxes[2].fields[0]);
            return newChartAxes;
          }
        }

        if (
          newChart === "funnel" ||
          newChart === "simplecard" ||
          newChart === "gauge" ||
          newChart === "richText"
        ) {
          keepOldData(propKey, false);
          newChartAxes[1].fields = getFieldsToChartAllowedNumbers(
            newChart,
            1,
            oldChartAxes[2].fields,
            oldChartAxes[3].fields
          );
          // Map filter to Filter
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          return newChartAxes;
        }

        if (
          newChart === "heatmap" ||
          newChart === "crossTab" ||
          newChart === "boxPlot"
        ) {
          keepOldData(propKey, false);
          if (oldChartAxes[1].fields.length > 0)
            newChartAxes[1].fields.push(oldChartAxes[1].fields[0]);

          newChartAxes[3].fields = getFieldsToChartAllowedNumbers(
            newChart,
            3,
            oldChartAxes[2].fields,
            oldChartAxes[3].fields
          );

          // Map filter to Filter
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          return newChartAxes;
        }

        if (newChart === "bubbleMap") {
          keepOldData(propKey, false);
          if (oldChartAxes[1].fields.length > 0)
            newChartAxes[2].fields.push(oldChartAxes[1].fields[0]);

          if (oldChartAxes[2].fields.length > 0)
            newChartAxes[3].fields.push(oldChartAxes[2].fields[0]);
          else if (oldChartAxes[3].fields.length > 0)
            newChartAxes[3].fields.push(oldChartAxes[3].fields[0]);

          // Map filter to Filter
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          return newChartAxes;
        }

        break;
      case "funnel":
        if (newChart === "funnel") {
          return oldChartAxes;
        }

        if (
          [
            "multibar",
            "stackedBar",
            "horizontalBar",
            "horizontalStacked",
            "line",
            "area",
            "pie",
            "table",
            "donut",
            "rose",
            "stackedArea",
            "calendar",
            "treeMap",
            "filledMap",
            "sankey",
          ].includes(newChart)
        ) {
          keepOldData(propKey, false);
          if (oldChartAxes[1].fields.length > 0)
            newChartAxes[2].fields = getFieldsToChartAllowedNumbers(
              newChart,
              2,
              oldChartAxes[1].fields
            );

          // Map filter to Filter
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          return newChartAxes;
        }

        if (newChart === "scatterPlot") {
          keepOldData(propKey, false);
          if (oldChartAxes[1].fields.length > 0) {
            if (oldChartAxes[1].fields.length > 1) {
              newChartAxes[3].fields.push(oldChartAxes[1].fields.shift());
              newChartAxes[2].fields.push(oldChartAxes[1].fields.shift());
            } else newChartAxes[3].fields = oldChartAxes[1].fields;
          }

          // Map filter to Filter
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          return newChartAxes;
        }

        if (
          newChart === "gauge" ||
          newChart === "richText" ||
          newChart === "simplecard"
        ) {
          keepOldData(propKey, false);
          if (oldChartAxes[1].fields.length > 0)
            newChartAxes[1].fields.push(oldChartAxes[1].fields[0]);

          // Map filter to Filter
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          return newChartAxes;
        }

        if (
          newChart === "heatmap" ||
          newChart === "crossTab" ||
          newChart === "boxPlot" ||
          newChart === "bubbleMap"
        ) {
          keepOldData(propKey, false);
          if (oldChartAxes[1].fields.length > 0)
            newChartAxes[3].fields = getFieldsToChartAllowedNumbers(
              newChart,
              3,
              oldChartAxes[1].fields
            );

          // Map filter to Filter
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          return newChartAxes;
        }

        break;
      case "gauge":
      case "simplecard":
        if (
          newChart === "gauge" ||
          newChart === "richText" ||
          newChart === "simplecard" ||
          newChart === "funnel"
        ) {
          return oldChartAxes;
        }
        if (
          [
            "multibar",
            "stackedBar",
            "horizontalBar",
            "horizontalStacked",
            "line",
            "area",
            "table",
            "pie",
            "donut",
            "rose",
            "stackedArea",
            "calendar",
            "treeMap",
            "filledMap",
            "sankey",
          ].includes(newChart)
        ) {
          keepOldData(propKey, false);
          if (oldChartAxes[1].fields.length > 0)
            newChartAxes[2].fields = getFieldsToChartAllowedNumbers(
              newChart,
              2,
              oldChartAxes[1].fields
            );

          // Map filter to Filter
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          return newChartAxes;
        }

        if (newChart === "scatterPlot") {
          keepOldData(propKey, false);
          if (oldChartAxes[1].fields.length > 0) {
            newChartAxes[3].fields.push(oldChartAxes[1].fields.shift());
          }

          // Map filter to Filter
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          return newChartAxes;
        }

        if (
          newChart === "crossTab" ||
          newChart === "boxPlot" ||
          newChart === "bubbleMap" ||
          newChart === "heatmap"
        ) {
          keepOldData(propKey, false);
          if (oldChartAxes[1].fields.length > 0)
            newChartAxes[3].fields = oldChartAxes[1].fields;

          // Map filter to Filter
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          return newChartAxes;
        }

        break;
      case "heatmap":
      case "boxPlot":
        if (
          newChart === "heatmap" ||
          newChart === "crossTab" ||
          newChart === "boxPlot" ||
          newChart === "bubbleMap"
        )
          return oldChartAxes;

        if (
          [
            "multibar",
            "stackedBar",
            "horizontalBar",
            "horizontalStacked",
            "line",
            "area",
            "table",
            "pie",
            "donut",
            "rose",
            "stackedArea",
            "treeMap",
            "filledMap",
            "sankey",
          ].includes(newChart)
        ) {
          keepOldData(propKey, false);
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          newChartAxes[1].fields = getFieldsToChartAllowedNumbers(
            newChart,
            1,
            oldChartAxes[1].fields,
            oldChartAxes[2].fields
          );

          if (oldChartAxes[3].fields.length > 0)
            newChartAxes[2].fields = getFieldsToChartAllowedNumbers(
              newChart,
              2,
              oldChartAxes[3].fields
            );

          return newChartAxes;
        }

        if (newChart === "calendar") {
          if (oldChartAxes[1].fields.length > 0) {
            if (
              oldChartAxes[1].fields[0].dataType === "date" ||
              oldChartAxes[1].fields[0].dataType === "timestamp"
            ) {
              keepOldData(propKey, false);
              updateChartData(propKey, "");

              newChartAxes[0].fields = oldChartAxes[0].fields;
              //In case of Calendar chart timegrain should be date
              newChartAxes[1].fields = [
                {
                  dataType: oldChartAxes[1].fields[0].dataType,
                  displayname: "date of " + oldChartAxes[1].fields[0].fieldname, // timegrain changed to date so change display name
                  fieldname: oldChartAxes[1].fields[0].fieldname,
                  tableId: oldChartAxes[1].fields[0].tableId,
                  uId: oldChartAxes[1].fields[0].uId,
                  timeGrain: "date",
                },
              ];
              if (oldChartAxes[3].fields.length > 0)
                newChartAxes[2].fields = oldChartAxes[3].fields;
              return newChartAxes;
            } else {
              keepOldData(propKey, false);

              newChartAxes[1].fields = [];
              if (oldChartAxes[3].fields.length > 0)
                newChartAxes[2].fields.push(oldChartAxes[3].fields[0]);

              return newChartAxes;
            }
          } else if (oldChartAxes[2].fields.length > 0) {
            if (
              oldChartAxes[2].fields[0].dataType === "date" ||
              oldChartAxes[2].fields[0].dataType === "timestamp"
            ) {
              keepOldData(propKey, false);
              updateChartData(propKey, "");

              newChartAxes[0].fields = oldChartAxes[0].fields;
              //In case of Calendar chart timegrain should be date
              newChartAxes[1].fields = [
                {
                  dataType: oldChartAxes[2].fields[0].dataType,
                  displayname: "date of " + oldChartAxes[2].fields[0].fieldname, // timegrain changed to date so change display name
                  fieldname: oldChartAxes[2].fields[0].fieldname,
                  tableId: oldChartAxes[2].fields[0].tableId,
                  uId: oldChartAxes[2].fields[0].uId,
                  timeGrain: "date",
                },
              ];
              if (oldChartAxes[3].fields.length > 0)
                newChartAxes[2].fields = oldChartAxes[3].fields;
              return newChartAxes;
            } else {
              keepOldData(propKey, false);

              newChartAxes[1].fields = [];
              if (oldChartAxes[3].fields.length > 0)
                newChartAxes[2].fields.push(oldChartAxes[3].fields[0]);

              return newChartAxes;
            }
          } else {
            keepOldData(propKey, false);

            newChartAxes[1].fields = [];
            if (oldChartAxes[3].fields.length > 0)
              newChartAxes[2].fields.push(oldChartAxes[3].fields[0]);

            return newChartAxes;
          }
        }

        if (newChart === "scatterPlot") {
          keepOldData(propKey, false);
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          newChartAxes[1].fields = getFieldsToChartAllowedNumbers(
            newChart,
            1,
            oldChartAxes[1].fields,
            oldChartAxes[2].fields
          );

          if (oldChartAxes[3].fields.length > 0)
            newChartAxes[3].fields = getFieldsToChartAllowedNumbers(
              newChart,
              3,
              oldChartAxes[3].fields
            );

          return newChartAxes;
        }

        if (newChart === "funnel") {
          keepOldData(propKey, false);
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          if (oldChartAxes[3].fields.length > 0)
            newChartAxes[1].fields = getFieldsToChartAllowedNumbers(
              newChart,
              1,
              oldChartAxes[3].fields
            );

          return newChartAxes;
        }

        if (
          newChart === "gauge" ||
          newChart === "richText" ||
          newChart === "simplecard"
        ) {
          keepOldData(propKey, false);
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          if (oldChartAxes[3].fields.length > 0)
            newChartAxes[1].fields.push(oldChartAxes[3].fields[0]);

          return newChartAxes;
        }

        break;

      case "crossTab" /*  PRAKASH  Demo Fixes 29Nov2024 */:
        if (
          newChart === "crossTab" ||
          newChart === "boxPlot" ||
          newChart === "bubbleMap"
        )
          return oldChartAxes;

        if (
          [
            "multibar",
            "stackedBar",
            "horizontalBar",
            "horizontalStacked",
            "line",
            "area",
            "table",
            "pie",
            "donut",
            "rose",
            "filledMap",
            "stackedArea",
            "treeMap",
            "filledMap",
            "sankey",
          ].includes(newChart)
        ) {
          // Map filter to Filter
          keepOldData(propKey, false);
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          newChartAxes[1].fields = getFieldsToChartAllowedNumbers(
            newChart,
            1,
            oldChartAxes[1].fields.concat(
              oldChartAxes[2].fields
            ) /*  PRAKASH  Demo Fixes 29Nov2024 */
          );

          if (oldChartAxes[3].fields.length > 0)
            newChartAxes[2].fields = getFieldsToChartAllowedNumbers(
              newChart,
              2,
              oldChartAxes[3].fields
            );

          return newChartAxes;
        }

        if (newChart === "calendar") {
          keepOldData(propKey, false);
          if (oldChartAxes[0].fields.length > 0) {
            newChartAxes[0].fields = oldChartAxes[0].fields;
          }

          if (oldChartAxes[1].fields.length > 0) {
            const row = oldChartAxes[1].fields.filter((el: any) => {
              return el.dataType === "date" || el.dataType === "timestamp";
            });
            const column = oldChartAxes[2].fields.filter((el: any) => {
              return el.dataType === "date" || el.dataType === "timestamp";
            });

            newChartAxes[1].fields = getFieldsToChartAllowedNumbers(
              newChart,
              1,
              [...row, ...column]
            );
            if (newChartAxes[1].fields.length > 0) {
              newChartAxes[1].fields[0].timeGrain = "date";
            }
          }

          if (oldChartAxes[3].fields.length > 0) {
            newChartAxes[2].fields = getFieldsToChartAllowedNumbers(
              newChart,
              2,
              oldChartAxes[3].fields
            );
          }
          updateChartData(propKey, "");

          return newChartAxes;
        }

        if (newChart === "scatterPlot") {
          keepOldData(propKey, false);
          // Map filter to Filter
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          newChartAxes[1].fields = getFieldsToChartAllowedNumbers(
            newChart,
            1,
            oldChartAxes[1].fields.concat(
              oldChartAxes[2].fields
            ) /*  PRAKASH  Demo Fixes 29Nov2024 */
          );

          if (oldChartAxes[3].fields.length > 0)
            newChartAxes[3].fields = getFieldsToChartAllowedNumbers(
              newChart,
              3,
              oldChartAxes[3].fields
            );

          return newChartAxes;
        }

        if (newChart === "funnel" || newChart === "simplecard") {
          keepOldData(propKey, false);
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          if (oldChartAxes[3].fields.length > 0)
            newChartAxes[1].fields = getFieldsToChartAllowedNumbers(
              newChart,
              1,
              oldChartAxes[3].fields
            );

          return newChartAxes;
        }

        if (newChart === "gauge" || newChart === "richText") {
          keepOldData(propKey, false);
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          if (oldChartAxes[3].fields.length > 0)
            newChartAxes[1].fields.push(oldChartAxes[3].fields[0]);

          return newChartAxes;
        }

        if (newChart === "heatmap") {
          keepOldData(propKey, false);
          if (oldChartAxes[1].fields.length > 0) {
            newChartAxes[1].fields.push(oldChartAxes[1].fields[0]);
          }

          if (oldChartAxes[2].fields.length > 0) {
            newChartAxes[2].fields.push(oldChartAxes[2].fields[0]);
          }

          if (oldChartAxes[3].fields.length > 0) {
            newChartAxes[3].fields.push(oldChartAxes[3].fields[0]);
          }

          // Map filter to Filter
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          return newChartAxes;
        }
        break;

      case "bubbleMap":
        if (
          newChart === "crossTab" ||
          newChart === "boxPlot" ||
          newChart === "bubbleMap" ||
          newChart === "heatmap"
        )
          return oldChartAxes;

        if (
          [
            "multibar",
            "stackedBar",
            "horizontalBar",
            "horizontalStacked",
            "line",
            "area",
            "table",
            "pie",
            "donut",
            "rose",
            "filledMap",
            "stackedArea",
            "treeMap",
            "filledMap",
            "sankey",
          ].includes(newChart)
        ) {
          // Map filter to Filter
          keepOldData(propKey, false);
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          newChartAxes[1].fields = getFieldsToChartAllowedNumbers(
            newChart,
            1,
            oldChartAxes[2].fields,
            oldChartAxes[1].fields
          );

          if (oldChartAxes[3].fields.length > 0)
            newChartAxes[2].fields = getFieldsToChartAllowedNumbers(
              newChart,
              2,
              oldChartAxes[3].fields
            );

          return newChartAxes;
        }

        if (newChart === "calendar") {
          if (oldChartAxes[2].fields.length > 0) {
            if (
              oldChartAxes[2].fields[0].dataType === "date" ||
              oldChartAxes[2].fields[0].dataType === "timestamp"
            ) {
              keepOldData(propKey, false);
              updateChartData(propKey, "");

              newChartAxes[0].fields = oldChartAxes[0].fields;
              newChartAxes[1].fields = [
                {
                  dataType: oldChartAxes[2].fields[0].dataType,
                  displayname: "date of " + oldChartAxes[2].fields[0].fieldname, // timegrain changed to date so change display name
                  fieldname: oldChartAxes[2].fields[0].fieldname,
                  tableId: oldChartAxes[2].fields[0].tableId,
                  uId: oldChartAxes[2].fields[0].uId,
                  timeGrain: "date",
                },
              ];
              if (oldChartAxes[3].fields.length > 0)
                newChartAxes[2].fields = oldChartAxes[3].fields;
              return newChartAxes;
            } else {
              keepOldData(propKey, false);

              newChartAxes[1].fields = [];
              if (oldChartAxes[3].fields.length > 0)
                newChartAxes[2].fields.push(oldChartAxes[3].fields[0]);

              return newChartAxes;
            }
          } else if (oldChartAxes[1].fields.length > 0) {
            if (
              oldChartAxes[1].fields[0].dataType === "date" ||
              oldChartAxes[1].fields[0].dataType === "timestamp"
            ) {
              keepOldData(propKey, false);
              updateChartData(propKey, "");

              newChartAxes[0].fields = oldChartAxes[0].fields;
              newChartAxes[1].fields = [
                {
                  dataType: oldChartAxes[1].fields[0].dataType,
                  displayname: "date of " + oldChartAxes[1].fields[0].fieldname, // timegrain changed to date so change display name
                  fieldname: oldChartAxes[1].fields[0].fieldname,
                  tableId: oldChartAxes[1].fields[0].tableId,
                  uId: oldChartAxes[1].fields[0].uId,
                  timeGrain: "date",
                },
              ];
              if (oldChartAxes[3].fields.length > 0)
                newChartAxes[2].fields = oldChartAxes[3].fields;
              return newChartAxes;
            } else {
              keepOldData(propKey, false);

              newChartAxes[1].fields = [];
              if (oldChartAxes[3].fields.length > 0)
                newChartAxes[2].fields.push(oldChartAxes[3].fields[0]);

              return newChartAxes;
            }
          } else {
            keepOldData(propKey, false);

            newChartAxes[1].fields = [];
            if (oldChartAxes[3].fields.length > 0)
              newChartAxes[2].fields.push(oldChartAxes[3].fields[0]);

            return newChartAxes;
          }
        }

        if (newChart === "scatterPlot") {
          keepOldData(propKey, false);
          // Map filter to Filter
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          newChartAxes[1].fields = getFieldsToChartAllowedNumbers(
            newChart,
            1,
            oldChartAxes[1].fields,
            oldChartAxes[2].fields
          );

          if (oldChartAxes[3].fields.length > 0)
            newChartAxes[3].fields = getFieldsToChartAllowedNumbers(
              newChart,
              3,
              oldChartAxes[3].fields
            );

          return newChartAxes;
        }

        if (newChart === "funnel") {
          keepOldData(propKey, false);
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          if (oldChartAxes[3].fields.length > 0)
            newChartAxes[1].fields = getFieldsToChartAllowedNumbers(
              newChart,
              1,
              oldChartAxes[3].fields
            );

          return newChartAxes;
        }

        if (
          newChart === "gauge" ||
          newChart === "richText" ||
          newChart === "simplecard"
        ) {
          keepOldData(propKey, false);
          if (oldChartAxes[0].fields.length > 0)
            newChartAxes[0].fields = oldChartAxes[0].fields;

          if (oldChartAxes[3].fields.length > 0)
            newChartAxes[1].fields.push(oldChartAxes[3].fields[0]);

          return newChartAxes;
        }

        break;

      case "richText":
        if (
          [
            "multibar",
            "stackedBar",
            "horizontalBar",
            "horizontalStacked",
            "line",
            "area",
            "filledMap",
            "stackedArea",
            "treeMap",
            "sankey",
            "calendar",
            "filledMap",
            "pie",
            "table",
            "donut",
            "rose",
          ].includes(newChart)
        ) {
          keepOldData(propKey, false);
          newChartAxes[0].fields = [];
          newChartAxes[1].fields = [];
          newChartAxes[2].fields = [];
          return newChartAxes;
        }

        if (
          [
            "scatterPlot",
            "heatmap",
            "crossTab",
            "boxPlot",
            "bubbleMap",
          ].includes(newChart)
        ) {
          keepOldData(propKey, false);

          newChartAxes[0].fields = [];
          newChartAxes[1].fields = [];
          newChartAxes[2].fields = [];
          newChartAxes[3].fields = [];

          return newChartAxes;
        }

        if (
          newChart === "funnel" ||
          newChart === "simplecard" ||
          newChart === "gauge"
        ) {
          newChartAxes[0].fields = [];
          newChartAxes[1].fields = [];
          return newChartAxes;
        }

        break;

      default:
        return oldChartAxes;
    }
  };

  const addReportFilterGroup = (tempPropKey: string) => {
    let selectedFilterGroups = chartGroup.tabTile[tempPropKey] || [];
    let selectedDatasetID = chartProp.properties[tempPropKey]?.selectedDs?.id;

    if (!(selectedFilterGroups && selectedFilterGroups.length > 0)) {
      addChartFilterTabTileName(selectedDatasetID, tempPropKey);
    }
  };

  const handleAddTile = async (chartName: string) => {
    let tabObj = tabState.tabs[tabTileProps.selectedTabId];

    await addTile(
      tabObj.tabId,
      tabObj.nextTileId,
      tabTileProps.selectedTable,
      chartProp.properties[propKey].selectedDs,
      chartProp.properties[propKey].selectedTable,
      chartName
    );

    addReportFilterGroup(`${tabObj.tabId}.${tabObj.nextTileId}`);
  };

  const getAndUpdateNewChartAxes = (oldChart: string, newChart: string) => {
    const newChartAxes = switchAxesForCharts(oldChart, newChart);
    updateChartTypeAndAxes(propKey, newChart, newChartAxes);
    clearOverRideOnChartChange(oldChart, newChart, newChartAxes);
  };

  const renderChartTypes = chartTypes.map((chart) => {
    return (
      <img
        key={chart.name}
        className={
          // chart.name === selectedChart ? "chartIcon selected" : "chartIcon"
          `chartIcon ${
            chart.name === "simplecard" ? "simplecard" : ""
            } ${chart.name === selectedChart ? "selected" : ""}`
        }
        src={chart.icon}
        alt={chart.name}
        onClick={() => {
          if (
            [
              "multibar",
              "stackedBar",
              "horizontalBar",
              "horizontalStacked",
              "line",

              "pie",
              "donut",
              "rose",

              "area",
              "scatterPlot",

              "funnel",
              "gauge",
              "heatmap",

              "crossTab",
              "table",

              "filledMap",
              "stackedArea",
              "calendar",
              "bubbleMap",
              "boxPlot",
              "treeMap",
              "sankey",
              "richText",
              "simplecard",
            ].includes(chart.name)
          ) {
            Logger("info", chart.name, "clicked");
            var oldChartAxes = chartProp.properties[propKey].chartAxes;

            //CASE 1: when switching from richtext to richtext
            if (
              chartProp.properties[propKey].chartType === "richText" &&
              chart.name === "richText"
            ) {
              getAndUpdateNewChartAxes(
                chartProp.properties[propKey].chartType,
                chart.name
              );
            }
            //CASE 2: when switching from richtext to otherCharts
            else if (
              chartProp.properties[propKey].chartType === "richText" &&
              chart.name !== "richText"
            ) {
              //check whether richtext contains content or not to open selected chart in same tile
              if (
                chartControls.properties[propKey].richText === "" ||
                chartControls.properties[propKey].richText === "<p><br></p>"
              ) {
                getAndUpdateNewChartAxes(
                  chartProp.properties[propKey].chartType,
                  chart.name
                );
              }
              //if richtext contain contents,then open selected chart in new tile
              else {
                handleAddTile(chart.name);
              }
            }

            //CASE 3:when switching from other charts to rich text
            else if (
              chartProp.properties[propKey].chartType !== "richText" &&
              chart.name === "richText"
            ) {
              //check whether axes of oldchart is empty or not to open richtext in the same tile
              var noOfAxes = oldChartAxes.length;
              oldChartAxes.map((axes: any) => {
                if (axes.fields.length === 0) {
                  noOfAxes = noOfAxes - 1;
                }
              });

              if (
                // oldChartAxes[0].fields.length === 0 &&
                // oldChartAxes[1].fields.length === 0 &&
                // oldChartAxes[2].fields.length === 0
                noOfAxes === 0
              ) {
                getAndUpdateNewChartAxes(
                  chartProp.properties[propKey].chartType,
                  chart.name
                );
              }
              //if chartAxes of oldchart is not empty, then open richtext in new tile
              else {
                handleAddTile(chart.name);
              }
            }

            //CASE 4:when switching between charts other than richtext
            else {
              getAndUpdateNewChartAxes(
                chartProp.properties[propKey].chartType,
                chart.name
              );
              // const newChartAxes = switchAxesForCharts(
              // 	chartProp.properties[propKey].chartType,
              // 	chart.name
              // );
              // updateChartTypeAndAxes(propKey, chart.name, newChartAxes);
            }
          }
        }}
        title={chart.value}
      />
    );
  });

  return (
    <React.Fragment>
      <div className="chartIconsContainer">{renderChartTypes}</div>
    </React.Fragment>
  );
};
const mapStateToProps = (state: any) => {
  return {
    chartProp: state.chartProperties,
    tabState: state.tabState,
    tabTileProps: state.tabTileProps,
    chartControls: state.chartControls,
    chartGroup: state.chartFilterGroup,
  };
};
const mapDispatchToProps = (dispatch: Dispatch<any>) => {
  return {
    updateChartTypeAndAxes: (
      propKey: string,
      chartType: string,
      newAxes: any
    ) => dispatch(changeChartTypeAndAxes(propKey, chartType, newAxes)),
    keepOldData: (propKey: string, reUseData: boolean) =>
      dispatch(canReUseData(propKey, reUseData)),
    updateChartData: (propKey: string, chartData: string | any) =>
      dispatch(updateChartData(propKey, chartData)),
    addTile: (
      tabId: number,
      nextTileId: number,
      table: any,
      selectedDataset: any,
      selectedTables: any,
      chartName: string
    ) =>
      dispatch(
        actionsToAddTileForRichText({
          tabId,
          nextTileId,
          table,
          fromTab: false,
          selectedDs: selectedDataset,
          selectedTablesInDs: selectedTables,
          chartName,
        })
      ),
    selectTile: (
      tabId: number,
      tileName: string,
      tileId: number,
      nextTileId: number,
      fromTab: boolean,
      fileId: any
    ) =>
      dispatch(
        actionsToUpdateSelectedTile(
          tabId,
          tileName,
          tileId,
          nextTileId,
          fromTab,
          fileId
        )
      ),
    addChartFilterTabTileName: (
      selectedDatasetID: string,
      tabTileName: string
    ) => dispatch(addChartFilterTabTileName(selectedDatasetID, tabTileName)),
    updateQueryParam: (
      propKey: string,
      binIndex: number,
      itemIndex: number,
      item: any,
      currentChartAxesName: string
    ) =>
      dispatch(
        editChartPropItem("updateQuery", {
          propKey,
          binIndex,
          itemIndex,
          item,
          currentChartAxesName,
        })
      ),
    enableOverrideForUIDAction: (propKey: string, uId: string) =>
      dispatch(enableOverrideForUIDAction(propKey, uId)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ChartTypes);
