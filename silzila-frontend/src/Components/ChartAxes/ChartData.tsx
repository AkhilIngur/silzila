// This component houses the dropzones for table fields
// Number of dropzones and its name is returned according to the chart type selected.
// Once minimum number of fields are met for the given chart type, server call is made to get chart data and saved in store

import React, { useEffect, useMemo, useState } from "react";

import { connect } from "react-redux";
import ChartsInfo from "./ChartsInfo2";
import LoadingPopover from "../CommonFunctions/PopOverComponents/LoadingPopover";
//import {FindFieldName} from "../CommonFunctions/CommonFunctions";
import { Dispatch } from "redux";
import {
  updateChartData,
  updateRichTextDynamicValue,
} from "../../redux/ChartPoperties/ChartControlsActions";

import { storeServerData } from "../../redux/ChartPoperties/ChartControlsActions";
import {
  editChartPropItem,
  canReUseData,
  toggleAxesEdited,
} from "../../redux/ChartPoperties/ChartPropertiesActions";
import FetchData from "../ServerCall/FetchData";
import {
  AxesValuProps,
  ChartAxesFormattedAxes,
  ChartAxesProps,
  ITabTilesAndTheirFilters,
} from "./ChartAxesInterfaces";
import { ChartPropertiesStateProps } from "../../redux/ChartPoperties/ChartPropertiesInterfaces";

import { TabTileStateProps2 } from "../../redux/TabTile/TabTilePropsInterfaces";
import { isLoggedProps } from "../../redux/UserInfo/IsLoggedInterfaces";
import { chartFilterGroupEdited } from "../../redux/ChartFilterGroup/ChartFilterGroupStateActions";
import {
  ChartFilterGroupProps,
  ChartFilterGroupStateProps,
} from "../../redux/ChartFilterGroup/ChartFilterGroupInterface";
import { dashBoardFilterGroupsEdited } from "../../redux/DashBoardFilterGroup/DashBoardFilterGroupAction";
import { DashBoardFilterGroupStateProps } from "../../redux/DashBoardFilterGroup/DashBoardFilterGroupInterface";
import { TileRibbonStateProps } from "../../Components/TabsAndTiles/TileRibbonInterfaces";
import { setDashTileSwitched } from "../../redux/TabTile/TabTileActionsAndMultipleDispatches";
import { updateChartDataForDm } from "../../redux/DynamicMeasures/DynamicMeasuresActions";
import Logger from "../../Logger";
import { NotificationDialog } from "../CommonFunctions/DialogComponents";
import { AlertColor } from "@mui/material/Alert";

import {
  deleteTablecf,
  updatecfObjectOptions,
} from "../../redux/ChartPoperties/ChartControlsActions";

import {
  interpolateColor,
  generateRandomColorArray,
  fieldName,
  displayName,
  getLabelValues,
  modifyFilter,
  getCalculationByUid,
} from "../CommonFunctions/CommonFunctions";
import { IFilter, IFilterPanel } from "../DataSet/BottomBarInterfaces";
import { formatChartLabelValue } from "../ChartOptions/Format/NumberFormatter";
import _, { debounce } from "lodash";
// format the chartAxes into the way it is needed for api call
export const getChartData = async (
  axesValues: AxesValuProps[],
  chartProp: any,
  chartGroup: ChartFilterGroupProps,
  dashBoardGroup: any,
  propKey: string,
  screenFrom: string,
  token: string,
  chartType: any,
  forQueryData?: boolean,
  savedCalculations?: any,
  showErrorNotification?: any
) => {
  let _chartAxes: any = [];

  const savedCalculatedFieldNames = savedCalculations?.map(
    (item: any) => item.calculationInfo.calculatedFieldName
  );

  if (chartProp.chartAxes) {
    _chartAxes = chartProp.chartAxes;
  } else {
    _chartAxes = chartProp.properties[propKey].chartAxes;
  }

  /*	PRS 21/07/2022	Construct filter object for service call */
  const getChartLeftFilter = (filters: any, name: string) => {
    let _type: any = {};

    //let _chartProp = chartProp.properties[propKey].chartAxes[0];
    let _chartProp = filters;

    _type.panelName = name;
    _type.shouldAllConditionsMatch = !_chartProp.any_condition_match;
    _type.filters = [];

    /*	To determine filter type	*/
    const _getFilterType = (item: any) => {
      let _type = "";

      if (item.fieldtypeoption === "Relative Filter") return "relativeFilter";

      if (
        item.filterTypeTillDate === "enabled" &&
        item.fieldtypeoption === "Pick List" &&
        item.exprTypeTillDate
      ) {
        return "tillDate";
      }

      switch (item.dataType) {
        case "integer":
        case "decimal":
          _type = "number";
          break;
        case "timestamp":
        case "date":
          _type = "date";
          break;
        default:
          _type = "text";
          break;
      }

      return _type.concat(
        "_",
        item.fieldtypeoption === "Search Condition"
          ? "search"
          : "user_selection"
      );
    };

    /*	Set User Selection property */
    const _getUserSelection = (item: any) => {
      Logger("info", "user selection", item.userSelection ?? "undefined");
      if (
        item.filterTypeTillDate === "enabled" &&
        item.fieldtypeoption === "Pick List" &&
        item.exprTypeTillDate
      ) {
        return item.userSelection;
      }
      if (item.fieldtypeoption === "Search Condition") {
        if (item.exprType === "blank") return [];
        if (
          item.exprType === "between" &&
          (item.greaterThanOrEqualTo || item.lessThanOrEqualTo)
        ) {
          return [item.greaterThanOrEqualTo, item.lessThanOrEqualTo];
        } else if (item.exprInput) {
          return [item.exprInput];
        } else {
          return [""];
        }
      } else if (item.fieldtypeoption === "Pick List") {
        return item.userSelection?.filter((item: any) => item !== "(All)");
      } else {
        return [""];
      }
    };

    const _isInvalidValue = (val: any) => {
      if (val === undefined || val === null || val === "") {
        return true;
      }

      return false;
    };

    /*	Determine whether to add a particular field	*/
    const _getIsFilterValidToAdd = (item: any) => {
      Logger("info", "item in chart data", item);
      if (!item.fieldtypeoption) {
        return false;
      }

      if (
        item.fieldtypeoption === "Pick List" //&&
        // item.userSelection &&
        // item.userSelection.length > 0
      ) {
        // if (item.filterTypeTillDate !== "enabled") {
        //   return true;
        // } else {
        //   if (item.exprTypeTillDate) {
        //     return true;
        //   } else {
        //     return false;
        //   }
        // }
        // return item.userSelection&& item.userSelection.length>0 && !item.userSelection.includes("(All)");
        // if (item.userSelection) {
        //   if (
        //     item.filterTypeTillDate === "enabled" &&
        //     !item.exprTypeTillDate

        //   ) {
        //     return (item.userSelection.length === 0||item.userSelection.inclides("(All)") )
        //   }
        //   else if ()
        //   else {
        //     return true;
        //   }
        // }
        // else if( item.exprTypeTillDate === true)return true
        // else {
        //   return false;
        // }
        if (item.filterTypeTillDate === "enabled" && item.exprTypeTillDate)
          return true;
        else if (item.userSelection) {
          if (
            item.userSelection.length === 0 ||
            item.userSelection.includes("(All)")
          )
            return false;
          else {
            return true;
          }
        }
        return false;
      } else if (item.fieldtypeoption === "Search Condition") {
        //   if (
        //     item.exprType === "between" &&
        //     item.greaterThanOrEqualTo &&
        //     item.lessThanOrEqualTo &&
        //     item.rawselectmembers?.length > 0
        //   ) {
        //     if (
        //       item.greaterThanOrEqualTo <= item.rawselectmembers[1] &&
        //       item.lessThanOrEqualTo >= item.rawselectmembers[item.rawselectmembers.length - 1]
        //     ){
        //       return false;
        // 	}
        //   } else

        if (
          item.exprType === "between" &&
          (_isInvalidValue(item.greaterThanOrEqualTo) ||
            _isInvalidValue(item.lessThanOrEqualTo))
        ) {
          return false;
        } else if (item.exprType === "blank") return true;
        else if (
          item.exprType !== "between" &&
          _isInvalidValue(item.exprInput)
        ) {
          return false;
        }
      } else if (item.fieldtypeoption === "Relative Filter") {
        return true;
        // return false;
      } else {
        return false;
      }

      return true;
    };
    const getCalculationInfoByUid = (uid: string) => {
      if (!savedCalculations || !uid) return null;

      return savedCalculations.find((item: any) => item.uuid === uid);
    };
    let _items = [];

    if (_chartProp.fields) _items = _chartProp.fields;
    else _items = _chartProp;
    /*	Iterate through each fields added in the Filter Dropzone	*/
    _items.forEach((item: any) => {
      let _filter: any = {};
      _filter.filterType = _getFilterType(item);
      _filter.tableId = item.tableId;
      _filter.fieldName = item.fieldname;
      _filter.displayName = item.displayname;
      _filter.dataType = item.dataType.toLowerCase();
      _filter.shouldExclude = item.includeexclude === "Exclude";
      if (item.fieldtypeoption === "Relative Filter")
        _filter.shouldExclude = false;

      if (item.fieldtypeoption === "Search Condition") {
        if (item.exprType) {
          _filter.operator = item.exprType;
          ///For Not Equal To operator
          if (item.exprType === "notEqualTo") {
            _filter.operator = "equalTo";
            _filter.shouldExclude = !_filter.shouldExclude;
          }
        } else {
          _filter.operator =
            item.dataType === "text" ? "begins_with" : "greater_than";
        }
      } else if (item.fieldtypeoption === "Pick List") {
        _filter.operator = "in";
      } else {
        _filter.operator = "between";
      }
      if (_filter.filterType === "tillDate") {
        _filter.operator = "in";
      }

      if (item.dataType === "timestamp" || item.dataType === "date") {
        _filter.timeGrain = item.prefix;
        // if (_filter.filterType !== "tillDate")
        _filter.isTillDate = item.exprTypeTillDate;
      }
      if (item.fieldtypeoption === "Relative Filter") {
        _filter.timeGrain = "date";
        _filter.relativeCondition = {
          from: [
            item.expTypeFromRelativeDate,
            item.exprInputFromValueType,
            item.expTypeFromdate,
          ],
          to: [
            item.expTypeToRelativeDate,
            item.exprInputToValueType,
            item.expTypeTodate,
          ],
          anchorDate:
            item.expTypeAnchorDate !== "specificDate"
              ? item.expTypeAnchorDate
              : item.exprInputSpecificDate,
        };
      }

      _filter.userSelection = _getUserSelection(item);
      if (item.SavedCalculationUUID) {
        const calculation = getCalculationInfoByUid(item.SavedCalculationUUID);
        if (calculation) {
          _filter.calculatedField = [calculation.calculationInfo];
          _filter.isCalculatedField = true;
        }
      }
      if (_getIsFilterValidToAdd(item)) {
        _type.filters.push(_filter);
      }
    });

    return _type;
  };

  const getFormattedAxes = (axesValuesParam: any) => {
    /*	PRS 21/07/2022 */
    let formattedAxes: ChartAxesFormattedAxes = {};

    axesValuesParam.forEach((axis: AxesValuProps) => {
      var dim = "";
      switch (axis.name) {
        case "Filter":
          dim = "filters";
          break;

        case "Dimension":
        case "Date":
        case "Row":
        case "Column":
          dim = "dimensions";
          break;

        case "Location":
          /*	dim = "dims";	*/
          dim = "dimensions";
          break;

        case "Measure":
          dim = "measures";
          break;

        case "X Axis":
          dim = "measures";
          break;

        case "Y Axis":
          dim = "measures";
          break;
      }

      var formattedFields: any = [];

      axis.fields.forEach((field: any) => {
        var formattedField: any = {
          tableId: field.tableId,
          displayName: field.displayname,
          fieldName: field.fieldname,
          dataType: field.dataType?.toLowerCase(),
          rollupDepth: field.rollupDepth ? true : false,
          measureOrder: field.measureOrder,
        };

        if (field.rollupDepth !== undefined) {
          formattedField.rollupDepth = field.rollupDepth; // ? true : false
        }

        if (field.dataType === "date" || field.dataType === "timestamp") {
          formattedField.timeGrain = field.timeGrain;
        }

        if (axis.name === "Measure") {
          formattedField.aggr = field.agg;

          if (formattedField.aggr === "agg") formattedField.aggr = "sum";
          //Updating windowFunction in QueryAPI
          if (field.windowfn) {
            //Function used to convert all the values of windowFunction in camelCase
            function toCamelCase(str: any) {
              return str
                .replace(/(?:^\w|[A-Z]|\b\w)/g, (word: any, index: any) => {
                  return index === 0 ? word.toLowerCase() : word.toUpperCase();
                })
                .replace(/\s+/g, "");
            }

            switch (field.windowfn.windowFnOptions) {
              case "standing": //If standing gets selected in windowFunction, then below data will be send to API
                //sending windowFn for all charts except richtext
                if (
                  ["heatmap", "crossTab", "boxPlot", "bubbleMap"].includes(
                    chartType
                  )
                ) {
                  if (
                    _chartAxes[1].fields.length === 0 &&
                    _chartAxes[2].fields.length === 0
                  ) {
                  } else {
                    formattedField.windowFn = [
                      toCamelCase(field.windowfn.windowFnOptions),
                      toCamelCase(field.windowfn.rank),
                      toCamelCase(field.windowfn.order),
                    ];
                  }
                } else {
                  if (
                    ![
                      "heatmap",
                      "crossTab",
                      "boxPlot",
                      "bubbleMap",
                      "richtext",
                    ].includes(chartType)
                  ) {
                    if (_chartAxes[1].fields.length === 0) {
                    } else {
                      formattedField.windowFn = [
                        toCamelCase(field.windowfn.windowFnOptions),
                        toCamelCase(field.windowfn.rank),
                        toCamelCase(field.windowfn.order),
                      ];
                    }
                  }
                }

                //sending windowFnMatrix for two dimensional charts
                if (
                  ["heatmap", "crossTab", "boxPlot", "bubbleMap"].includes(
                    chartType
                  )
                ) {
                  if (
                    _chartAxes[1].fields.length === 0 &&
                    _chartAxes[2].fields.length === 0
                  ) {
                  } else {
                    formattedField.windowFnMatrix = [
                      _chartAxes[1].fields.length,
                      _chartAxes[2].fields.length,
                    ];
                  }
                }

                //sending windowFnPartition for two dimensional charts
                if (
                  ["heatmap", "crossTab", "boxPlot", "bubbleMap"].includes(
                    chartType
                  )
                ) {
                  if (
                    _chartAxes[1].fields.length > 0 &&
                    _chartAxes[2].fields.length === 0
                  ) {
                    formattedField.windowFnPartition = [
                      field.windowfn.standingRowIndex,
                    ];
                  } else {
                    if (
                      _chartAxes[1].fields.length === 0 &&
                      _chartAxes[2].fields.length > 0
                    ) {
                      formattedField.windowFnPartition = [
                        field.windowfn.standingColumnIndex,
                      ];
                    } else {
                      if (
                        _chartAxes[1].fields.length > 0 &&
                        _chartAxes[2].fields.length > 0
                      ) {
                        formattedField.windowFnPartition = [
                          field.windowfn.standingRowIndex,
                          field.windowfn.standingColumnIndex,
                        ];
                      } else {
                        if (
                          _chartAxes[1].fields.length === 0 &&
                          _chartAxes[2].fields.length === 0
                        ) {
                        }
                      }
                    }
                  }
                } else {
                  //sending windowFnPartition for one dimensional charts
                  if (
                    ![
                      "heatmap",
                      "crossTab",
                      "boxPlot",
                      "bubbleMap",
                      "richtext",
                    ].includes(chartType)
                  ) {
                    if (_chartAxes[1].fields.length === 0) {
                    } else {
                      formattedField.windowFnPartition = [
                        field.windowfn.standingRowIndex,
                      ];
                    }
                  }
                }

                break;
              case "sliding": //If sliding gets selected in windowFunction then, below data will be send to API
                //sending windowFn for all charts except richtext
                if (
                  ["heatmap", "crossTab", "boxPlot", "bubbleMap"].includes(
                    chartType
                  )
                ) {
                  if (
                    _chartAxes[1].fields.length === 0 &&
                    _chartAxes[2].fields.length === 0
                  ) {
                  } else {
                    formattedField.windowFn = [
                      toCamelCase(field.windowfn.windowFnOptions),
                      toCamelCase(field.windowfn.slidingAggregation),
                    ];
                  }
                } else {
                  if (
                    ![
                      "heatmap",
                      "crossTab",
                      "boxPlot",
                      "bubbleMap",
                      "richtext",
                    ].includes(chartType)
                  ) {
                    if (_chartAxes[1].fields.length === 0) {
                    } else {
                      formattedField.windowFn = [
                        toCamelCase(field.windowfn.windowFnOptions),
                        toCamelCase(field.windowfn.slidingAggregation),
                      ];
                    }
                  }
                }

                //sending windowFnOption for all charts except richtext
                if (
                  ["heatmap", "crossTab", "boxPlot", "bubbleMap"].includes(
                    chartType
                  )
                ) {
                  if (
                    _chartAxes[1].fields.length === 0 &&
                    _chartAxes[2].fields.length === 0
                  ) {
                  } else {
                    formattedField.windowFnOption = [
                      field.windowfn.slidingPreInc,
                      field.windowfn.slidingCurrent,
                      field.windowfn.slidingNextInc,
                    ];
                  }
                } else {
                  if (
                    ![
                      "heatmap",
                      "crossTab",
                      "boxPlot",
                      "bubbleMap",
                      "richtext",
                    ].includes(chartType)
                  ) {
                    if (_chartAxes[1].fields.length === 0) {
                    } else {
                      formattedField.windowFnOption = [
                        field.windowfn.slidingPreInc,
                        field.windowfn.slidingCurrent,
                        field.windowfn.slidingNextInc,
                      ];
                    }
                  }
                }

                //sending windowFnMatrix for two dimensional charts
                if (
                  ["heatmap", "crossTab", "boxPlot", "bubbleMap"].includes(
                    chartType
                  )
                ) {
                  if (
                    _chartAxes[1].fields.length === 0 &&
                    _chartAxes[2].fields.length === 0
                  ) {
                  } else {
                    formattedField.windowFnMatrix = [
                      _chartAxes[1].fields.length,
                      _chartAxes[2].fields.length,
                    ];
                  }
                }

                //sending windowFnPartition for two dimensional charts
                if (
                  ["heatmap", "crossTab", "boxPlot", "bubbleMap"].includes(
                    chartType
                  )
                ) {
                  if (
                    _chartAxes[1].fields.length > 0 &&
                    _chartAxes[2].fields.length === 0
                  ) {
                    formattedField.windowFnPartition = [
                      field.windowfn.slidingRowIndex,
                    ];
                  } else {
                    if (
                      _chartAxes[1].fields.length === 0 &&
                      _chartAxes[2].fields.length > 0
                    ) {
                      formattedField.windowFnPartition = [
                        field.windowfn.slidingColumnIndex,
                      ];
                    } else {
                      if (
                        _chartAxes[1].fields.length > 0 &&
                        _chartAxes[2].fields.length > 0
                      ) {
                        formattedField.windowFnPartition = [
                          field.windowfn.slidingRowIndex,
                          field.windowfn.slidingColumnIndex,
                          ["rowwise"].includes(
                            field.windowfn.slidingSlideDirection
                          )
                            ? 0
                            : 1,
                        ];
                      } else {
                        if (
                          _chartAxes[1].fields.length === 0 &&
                          _chartAxes[2].fields.length === 0
                        ) {
                        }
                      }
                    }
                  }
                } else {
                  //sending windowFnPartition for one dimensional charts
                  if (
                    ![
                      "heatmap",
                      "crossTab",
                      "boxPlot",
                      "bubbleMap",
                      "richtext",
                    ].includes(chartType)
                  ) {
                    if (_chartAxes[1].fields.length === 0) {
                    } else {
                      formattedField.windowFnPartition = [
                        field.windowfn.slidingRowIndex,
                      ];
                    }
                  }
                }

                break;
              case "standingsvssliding": //If standingsvssliding gets selected in windowFunction, then below data will be send to API
                //sending windowFn for all charts except richtext
                if (
                  ["heatmap", "crossTab", "boxPlot", "bubbleMap"].includes(
                    chartType
                  )
                ) {
                  if (
                    _chartAxes[1].fields.length === 0 &&
                    _chartAxes[2].fields.length === 0
                  ) {
                  } else {
                    formattedField.windowFn = [
                      toCamelCase(field.windowfn.percentage),
                      ["First", "Last"].includes(
                        field.windowfn.standingSlidingReferenceWn
                      )
                        ? toCamelCase(field.windowfn.standingSlidingReferenceWn)
                        : toCamelCase(
                          field.windowfn.standingSlidingAggregation
                        ),
                    ];
                  }
                } else {
                  if (
                    ![
                      "heatmap",
                      "crossTab",
                      "boxPlot",
                      "bubbleMap",
                      "richtext",
                    ].includes(chartType)
                  ) {
                    if (_chartAxes[1].fields.length === 0) {
                    } else {
                      formattedField.windowFn = [
                        toCamelCase(field.windowfn.percentage),
                        ["First", "Last"].includes(
                          field.windowfn.standingSlidingReferenceWn
                        )
                          ? toCamelCase(
                            field.windowfn.standingSlidingReferenceWn
                          )
                          : toCamelCase(
                            field.windowfn.standingSlidingAggregation
                          ),
                      ];
                    }
                  }
                }

                //sending windowFnOption for all charts except richtext
                if (
                  ["PNC"].includes(field.windowfn.standingSlidingReferenceWn)
                ) {
                  if (
                    ["heatmap", "crossTab", "boxPlot", "bubbleMap"].includes(
                      chartType
                    )
                  ) {
                    if (
                      _chartAxes[1].fields.length === 0 &&
                      _chartAxes[2].fields.length === 0
                    ) {
                    } else {
                      formattedField.windowFnOption = [
                        field.windowfn.standingSlidingPreInc,
                        field.windowfn.standingSlidingCurrent,
                        field.windowfn.standingSlidingNextInc,
                      ];
                    }
                  } else {
                    if (
                      ![
                        "heatmap",
                        "crossTab",
                        "boxPlot",
                        "bubbleMap",
                        "richtext",
                      ].includes(chartType)
                    ) {
                      if (_chartAxes[1].fields.length === 0) {
                      } else {
                        formattedField.windowFnOption = [
                          field.windowfn.standingSlidingPreInc,
                          field.windowfn.standingSlidingCurrent,
                          field.windowfn.standingSlidingNextInc,
                        ];
                      }
                    }
                  }
                }

                //sending windowFnMatrix for two dimensional charts
                if (
                  ["heatmap", "crossTab", "boxPlot", "bubbleMap"].includes(
                    chartType
                  )
                ) {
                  if (
                    _chartAxes[1].fields.length === 0 &&
                    _chartAxes[2].fields.length === 0
                  ) {
                  } else {
                    formattedField.windowFnMatrix = [
                      _chartAxes[1].fields.length,
                      _chartAxes[2].fields.length,
                    ];
                  }
                }

                //sending windowFnPartition for two dimensional charts
                if (
                  ["heatmap", "crossTab", "boxPlot", "bubbleMap"].includes(
                    chartType
                  )
                ) {
                  if (
                    _chartAxes[1].fields.length > 0 &&
                    _chartAxes[2].fields.length === 0
                  ) {
                    formattedField.windowFnPartition = [
                      field.windowfn.standingSlidingRowIndex,
                    ];
                  } else {
                    if (
                      _chartAxes[1].fields.length === 0 &&
                      _chartAxes[2].fields.length > 0
                    ) {
                      formattedField.windowFnPartition = [
                        field.windowfn.standingSlidingColumnIndex,
                      ];
                    } else {
                      if (
                        _chartAxes[1].fields.length > 0 &&
                        _chartAxes[2].fields.length > 0
                      ) {
                        formattedField.windowFnPartition = [
                          field.windowfn.standingSlidingRowIndex,
                          field.windowfn.standingSlidingColumnIndex,
                          ["rowwise"].includes(
                            field.windowfn.standingSlidingSlideDirection
                          )
                            ? 0
                            : 1,
                        ];
                      } else {
                        if (
                          _chartAxes[1].fields.length === 0 &&
                          _chartAxes[2].fields.length === 0
                        ) {
                        }
                      }
                    }
                  }
                } else {
                  //sending windowFnPartition for one dimensional charts
                  if (
                    ![
                      "heatmap",
                      "crossTab",
                      "boxPlot",
                      "bubbleMap",
                      "richtext",
                    ].includes(chartType)
                  ) {
                    if (_chartAxes[1].fields.length === 0) {
                    } else {
                      formattedField.windowFnPartition = [
                        field.windowfn.standingSlidingRowIndex,
                      ];
                    }
                  }
                }
                break;
            }
          }
        }
        formattedFields.push(formattedField);
      });

      if (!formattedAxes[dim]) {
        formattedAxes[dim] = formattedFields;
      } else {
        formattedAxes[dim] = [...formattedAxes[dim], ...formattedFields];
      }
    });

    formattedAxes.fields = [];

    if (
      chartType === "funnel" ||
      chartType === "gauge" ||
      chartType === "simplecard" ||
      chartType === "richText"
    ) {
      formattedAxes.dimensions = [];
    }

    formattedAxes.filterPanels = [];

    /*	PRS 21/07/2022	Get filter object and pushed to request body object	*/

    //let _filterZoneFields = _chartAxes[0].fields; /*	PRS For Override	*/
    let _filterZoneFields = axesValuesParam[0].fields;
    let _hasInvalidFilterData = _filterZoneFields.filter(
      (field: any) => field.isInValidData
    );

    if (
      _filterZoneFields.length > 0 &&
      _hasInvalidFilterData &&
      _hasInvalidFilterData.length > 0
    ) {
      Logger("info", "Filter has invalid data.");
      return;
    }

    //let _filterObj = getChartLeftFilter(_chartAxes[0]); /*	PRS 21/07/2022	Get filter object and pushed to request body object	*/
    let _filterObj = getChartLeftFilter(axesValuesParam[0], "chartFilters");
    if (_filterObj.filters.length > 0) {
      formattedAxes.filterPanels.push(_filterObj);
    }

    if (
      axesValuesParam.find((axes: any) => axes.name === "Measure")?.fields[0]
        ?.disableReportFilterForOverride
    ) {
      Logger(
        "info",
        "report filter  override",
        axesValuesParam.find((axes: any) => axes.name === "Measure").fields[0]
      );
    } else {
      if (screenFrom === "Dashboard") {
        dashBoardGroup.groups.forEach((grp: string) => {
          if (dashBoardGroup.filterGroupTabTiles[grp].includes(propKey)) {
            ////Check this condition 1. group check if cont 2. propkey

            let rightFilterObj = getChartLeftFilter(
              chartGroup.groups[grp].filters,
              "reportFilters"
            );

            if (rightFilterObj.filters.length > 0) {
              formattedAxes.filterPanels.push(rightFilterObj);
            }
          }
        });
      } else {
        //chartGroup
        Logger("info", "getting reportfilkter");
        chartGroup.tabTile[propKey]?.forEach((grp: any) => {
          let rightFilterObj = getChartLeftFilter(
            chartGroup.groups[grp].filters,
            "reportFilters"
          );

          if (rightFilterObj.filters.length > 0) {
            formattedAxes.filterPanels.push(rightFilterObj);
          }
        });
      }
    }

    return formattedAxes;
  };

  let allMeasureFields: any = axesValues.find(
    (axis: any) => axis.name === "Measure"
  );

  [...allMeasureFields?.fields].forEach((field: any, idx: number) => {
    field.measureOrder = idx + 1;
  });

  let hasMeasureOverride = allMeasureFields?.fields.filter((field: any) => {
    return field.override ? true : false;
  });

  let hasNoMeasureOverride = allMeasureFields?.fields.filter((field: any) => {
    return field.override ? false : true;
  });
  let formattedAxes: any = [];

  if (hasMeasureOverride && hasMeasureOverride.length > 0) {
    let hasNoMeasureOverrideFields = JSON.parse(
      JSON.stringify(hasNoMeasureOverride)
    );

    let tempAxesValues = JSON.parse(JSON.stringify(axesValues));

    tempAxesValues.find((axis: any) => axis.name === "Measure").fields = [];
    tempAxesValues.find((axis: any) => axis.name === "Measure").fields =
      hasNoMeasureOverrideFields;
    let tempFormattedAxes = getFormattedAxes(tempAxesValues);
    tempFormattedAxes && formattedAxes.push(tempFormattedAxes);

    hasMeasureOverride.forEach((measureField: any) => {
      let tempMeasureField = JSON.parse(JSON.stringify(measureField));
      let tempOverrideAxes = JSON.parse(
        JSON.stringify(tempMeasureField.override)
      );

      delete tempMeasureField.override;

      if (chartProp.chartType === "scatterPlot") {
        tempOverrideAxes[2].name = "Measure";
        tempOverrideAxes[2].fields = [
          ...tempOverrideAxes[2].fields,
          ...tempOverrideAxes[3].fields,
        ];
        delete tempOverrideAxes[3];
      }

      tempOverrideAxes.find((axis: any) => axis.name === "Measure").fields = [];
      // console.log("tempMeasureField", tempMeasureField);
      tempOverrideAxes
        .find((axis: any) => axis.name === "Measure")
        .fields.push(tempMeasureField);

      let overrideFormattedAxes: any = getFormattedAxes(tempOverrideAxes);
      overrideFormattedAxes && formattedAxes.push(overrideFormattedAxes);
    });
  } else {
    let tempFormattedAxes = getFormattedAxes(axesValues);
    tempFormattedAxes && formattedAxes.push(tempFormattedAxes);
  }

  let _selectedDS: any = {};

  if (chartProp.selectedDs) {
    _selectedDS = chartProp.selectedDs;
  } else {
    _selectedDS = chartProp.properties[propKey].selectedDs;
  }

  let url = "";
  if (_selectedDS.isFlatFileData) {
    url = `query?datasetid=${_selectedDS.id}`;
  } else {
    url = `query?dbconnectionid=${_selectedDS.connectionId}&datasetid=${_selectedDS.id}&workspaceId=${_selectedDS.workSpaceId}`;
  }

  /*	PRS 21/07/2022	*/
  if (
    formattedAxes &&
    formattedAxes.length > 0 &&
    (formattedAxes[0].dimensions.length > 0 ||
      formattedAxes[0].measures.length > 0)
  ) {
    if (savedCalculations) {
      // check whether the measure is a calculated field or not
      formattedAxes.forEach((axis: any) => {
        const formattedMeasures = axis.measures;

        const formattedDimensions = axis.dimensions;

        savedCalculations &&
          formattedMeasures.forEach((measure: any) => {
            const measureFieldName = measure.fieldName;

            if (savedCalculatedFieldNames.includes(measureFieldName)) {
              const savedCalculationForThisMeasure = savedCalculations?.find(
                (item: any) =>
                  item.calculationInfo.calculatedFieldName === measureFieldName
              );
              const allSavedFlows = Object.keys(
                savedCalculationForThisMeasure.calculationInfo.flows
              );

              const isAgg =
                savedCalculationForThisMeasure.calculationInfo.flows[
                  allSavedFlows[allSavedFlows.length - 1]
                ][0].isAggregation;
              measure.isCalculatedField = true;
              measure.calculatedField = [
                {
                  calculatedFieldName: measureFieldName.split(" ").join(" "),
                  // TODO: [0] make it dynamic
                  isAggregated: isAgg,
                  fields: savedCalculationForThisMeasure.calculationInfo.fields,
                  flows: savedCalculationForThisMeasure.calculationInfo.flows,
                  conditionFilters:
                    savedCalculationForThisMeasure.calculationInfo
                      .conditionFilters,
                  // isAggregated: savedCalculationForThisMeasure.calculationInfo.flows[allSavedFlows[allSavedFlows.length - 1]][0].isAggregated,
                },
              ];
            }
          });

        savedCalculations &&
          formattedDimensions.forEach((dimension: any) => {
            const measureFieldName = dimension.fieldName;

            if (savedCalculatedFieldNames.includes(measureFieldName)) {
              const savedCalculationForThisMeasure = savedCalculations?.find(
                (item: any) =>
                  item.calculationInfo.calculatedFieldName === measureFieldName
              );
              const allSavedFlows = Object.keys(
                savedCalculationForThisMeasure.calculationInfo.flows
              );

              const isAgg =
                savedCalculationForThisMeasure.calculationInfo.flows[
                  allSavedFlows[allSavedFlows.length - 1]
                ][0].isAggregation;
              dimension.isCalculatedField = true;
              dimension.calculatedField = [
                {
                  calculatedFieldName: measureFieldName.split(" ").join(" "),
                  // TODO: [0] make it dynamic
                  isAggregated: isAgg,
                  fields: savedCalculationForThisMeasure.calculationInfo.fields,
                  flows: savedCalculationForThisMeasure.calculationInfo.flows,
                  conditionFilters:
                    savedCalculationForThisMeasure.calculationInfo
                      .conditionFilters,
                  // isAggregated: savedCalculationForThisMeasure.calculationInfo.flows[allSavedFlows[allSavedFlows.length - 1]][0].isAggregated,
                },
              ];
            }
          });
      });

      const formattedAxesWhereFlowsNeedToBeSorted = formattedAxes[0];

      for (const axes in formattedAxesWhereFlowsNeedToBeSorted) {
        for (const field of formattedAxesWhereFlowsNeedToBeSorted[axes]) {
          const isCalculatedField = field.isCalculatedField;

          if (!isCalculatedField) continue;
          else {
            for (const calc of field.calculatedField) {
              const calculationWhereFlowHasToBeSorted = calc;

              const dependencyTracker: {
                [key: string]: boolean;
              } = {};

              for (const flow in calculationWhereFlowHasToBeSorted.flows) {
                dependencyTracker[flow] = false;
              }

              const sortedDependencyStack: any = [];

              let cycleDetected = false;

              const flowSorter = (flow: string, visited: Set<string>) => {
                // Early return if a cycle was already detected
                if (cycleDetected) return;

                if (sortedDependencyStack.includes(flow)) return;
                if (visited.has(flow)) {
                  console.log("Cycle detected in flow: ", flow);
                  cycleDetected = true; // Set the flag when a cycle is detected
                  return;
                }

                visited.add(flow);
                dependencyTracker[flow] = true;

                for (const condition of calculationWhereFlowHasToBeSorted.flows[
                  flow
                ]) {
                  // Check early if cycle was detected in a recursive call
                  if (cycleDetected) return;

                  const sourceList = condition.source.filter(
                    (source: string, index: number) =>
                      condition.sourceType[index] === "flow"
                  );

                  if (condition.flow === "IfElse") {
                    const filterId = condition.filter;
                    const filter =
                      calculationWhereFlowHasToBeSorted.conditionFilters[
                      filterId
                      ][0];

                    for (const leftOperand of filter.conditions) {
                      const leftOperandType = leftOperand.leftOperandType[0];
                      if (
                        leftOperandType === "flow" &&
                        !sourceList.includes(leftOperand.leftOperand[0])
                      ) {
                        sourceList.push(leftOperand.leftOperand[0]);
                      }

                      const rightOperandType = leftOperand.rightOperandType[0];
                      if (
                        rightOperandType === "flow" &&
                        !sourceList.includes(leftOperand.rightOperand[0])
                      ) {
                        sourceList.push(leftOperand.rightOperand[0]);
                      }
                    }
                  }

                  for (const source of sourceList) {
                    flowSorter(source, new Set(visited)); // Pass a new set to avoid mutation issues
                    // Check after each recursive call
                    if (cycleDetected) return;
                  }
                }

                visited.delete(flow);

                if (!sortedDependencyStack.includes(flow)) {
                  sortedDependencyStack.push(flow);
                }
              };

              for (const flow in dependencyTracker) {
                if (cycleDetected) break; // Stop processing if a cycle was detected
                if (!sortedDependencyStack.includes(flow)) {
                  flowSorter(flow, new Set());
                }
              }

              if (cycleDetected) {
                console.log("Cyclic dependency detected");
                return;
              }

              const newSortedFlows: any = {};

              for (const sortedDependency of sortedDependencyStack) {
                newSortedFlows[sortedDependency] =
                  calculationWhereFlowHasToBeSorted.flows[sortedDependency];
              }

              calc.flows = newSortedFlows;
            }
          }
        }
      }
    }

    var res: any = await FetchData({
      requestType: "withData",
      method: "POST",
      url: url,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: formattedAxes,
    });

    if (res.status) {
      if (res.data && res.data.length > 0) {
        if (forQueryData) {
          return formattedAxes;
        } else {
          return res.data;
        }
      } else {
        Logger("info", "Change filter conditions.");
      }
    } else {
      Logger("error", "Get Table Data Error", res.data.message);

      if (showErrorNotification) {
        showErrorNotification("error", res.data.message);
      }
    }
  }
};

// given chart type, check if the dropzones have required number of fields

export const checkMinRequiredCards = (chartProp: any, chartType: any) => {
  var minReqMet = [];
  ChartsInfo[chartType].dropZones.forEach((zone: any, zoneI: number) => {
    chartProp.chartAxes[zoneI].fields.length >= zone.min
      ? minReqMet.push(true)
      : minReqMet.push(false);
  });

  if (chartType === "crossTab") {
    if (
      chartProp.chartAxes[1].fields.length > 0 ||
      chartProp.chartAxes[2].fields.length > 0 ||
      chartProp.chartAxes[3].fields.length > 0
    ) {
      minReqMet.push(true);
    } else {
      minReqMet.push(false);
    }
  }

  if (minReqMet.includes(false)) {
    return false;
  } else {
    return true;
  }
};

const ChartData = ({
  // props
  tabId,
  tileId,
  screenFrom,

  // state
  token,
  tabTileProps,
  tileState,
  tabState,
  chartControls,
  calculations,

  chartProperties,
  chartGroup,
  dashBoardGroup,
  dynamicMeasureState,
  // dispatch

  storeServerData,
  updateChartData,
  toggleAxesEdit,
  reUseOldData,
  updateRichTextDynamicValue,
  chartFilterGroupEdited,
  dashBoardFilterGroupsEdited,
  setDashTileSwitched,
  updateChartDataForDm,
  updatecfObjectOptions,
  deleteTablecf,
  updateQueryParam,
}: ChartAxesProps & TileRibbonStateProps) => {
  const [loading, setLoading] = useState<boolean>(false);

  let link: string = "";

  if (window.location.href.includes("dashboard")) {
    let url = window.location.href.split("/").slice(-1);
    link = url.toString();
  }

  var _propKey: string = `${tabId}.${tileId}`;

  const [openAlert, setOpenAlert] = useState<boolean>(false);
  const [testMessage, setTestMessage] = useState<string>("");
  const [severity, setSeverity] = useState<AlertColor>("success");

  const savedCalculations = useMemo(
    () => calculations?.savedCalculations,
    [calculations?.savedCalculations]
  );
  // every time chartAxes or chartType is changed, check if
  // new data must be obtained from server
  // check for minimum requirements in each dropzone for the given chart type
  // if not reset the data
  /**
   *
   * @param dmId
   * @param value (value fetched from server )
   * @returns  given value in selected style
   */
  const getFormatedValue = (dmId: number, value: any) => {
    let formattedValue = value;
    formattedValue = formatChartLabelValue(
      dynamicMeasureState.dynamicMeasureProps?.[
      dynamicMeasureState.selectedTabId
      ]?.[dynamicMeasureState.selectedTileId]?.[
      `${dynamicMeasureState.selectedTileId}.${dmId}`
      ],
      formattedValue
    );
    return formattedValue;
  };
  var chartProp: any =
    chartProperties.properties[_propKey].chartType === "richText" &&
      chartProperties.properties[_propKey].isDynamicMeasureWindowOpened
      ? dynamicMeasureState.dynamicMeasureProps?.[
      dynamicMeasureState.selectedTabId
      ]?.[dynamicMeasureState.selectedTileId]?.[
      `${dynamicMeasureState.selectedTileId}.${dynamicMeasureState.selectedDynamicMeasureId}`
      ]
      : chartProperties.properties[_propKey];

  // chartProperties.properties[_propKey].chartType === "richText" &&
  // chartProperties.properties[_propKey].isDynamicMeasureWindowOpened
  // 	? dynamicMeasureState.dynamicMeasureProps?.[dynamicMeasureState.selectedTabId]?.[
  // 			dynamicMeasureState.selectedTileId
  // 	  ]?.[
  // 			`${dynamicMeasureState.selectedTileId}.${dynamicMeasureState.selectedDynamicMeasureId}`
  // 	  ]
  // 	: chartProperties;

  const getMinAndMaxValue = (column: string) => {
    const valuesArray = chartControls.properties[_propKey].chartData.map(
      (el: any) => {
        return el[column];
      }
    );
    const minValue = Number(Math.min(...valuesArray)).toFixed(2);
    const maxValue = Number(Math.max(...valuesArray)).toFixed(2);

    return { min: minValue, max: maxValue };
  };

  const updateConditionalFormattingMinMax = () => {
    if (
      ["crossTab", "table"].includes(
        chartProperties.properties[_propKey].chartType
      )
    ) {
      let conditionalFormat = JSON.parse(
        JSON.stringify(
          chartControls.properties[_propKey]?.tableConditionalFormats
        )
      );

      if (conditionalFormat && conditionalFormat.length > 0) {
        [...conditionalFormat].forEach(async (format: any, index: number) => {
          let names = format.name.split(" of ");
          let name = names.length > 1 ? names[1] : names[0];
          let agg = names.length > 1 ? names[0] : "";

          let axesAllFields = [];
          let measureFields = [];

          if (chartProperties.properties[_propKey].chartType == "table") {
            axesAllFields = [
              ...chartProp.chartAxes[1].fields,
              ...chartProp.chartAxes[2].fields,
            ];
            measureFields = chartProp.chartAxes[2].fields;
          } else {
            axesAllFields = [
              ...chartProp.chartAxes[1].fields,
              ...chartProp.chartAxes[2].fields,
              ...chartProp.chartAxes[3].fields,
            ];
            measureFields = chartProp.chartAxes[3].fields;
          }

          let findField = axesAllFields.find((item: any) => {
            if (format.name.includes(item.fieldname)) {
              if (["date", "timestamp"].includes(item.dataType)) {
                if (format.name.split(" of ")[0] === item.timeGrain) {
                  return true;
                }
              } else {
                return true;
              }
            }
          });

          if (!findField) {
            deleteTablecf(_propKey, index);
          } else {
            let findMeasureField = measureFields.find((item: any) => {
              return item.fieldname === name;
            });

            if (!findMeasureField) {
              let _colValues = format.isLabel
                ? await getLabelValues(
                  format.name,
                  chartControls,
                  chartProperties,
                  _propKey,
                  token
                )
                : "";

              format.value = _colValues;
              format.name = fieldName(findField);

              updatecfObjectOptions(_propKey, index, format);
            } else {
              if (format.isGradient && !format.isUserChanged) {
                let minMaxValue: any = getMinAndMaxValue(fieldName(findField));

                let minObject = format.value.find(
                  (val: any) => val.name === "Min"
                ),
                  maxObject = format.value.find(
                    (val: any) => val.name === "Max"
                  ),
                  midObject = format.value.find(
                    (val: any) => val.name?.trim() === "Mid Value"
                  );

                if (!minObject.isUserChanged) minObject.value = minMaxValue.min;
                if (!maxObject.isUserChanged) maxObject.value = minMaxValue.max;
                if (midObject && !midObject.isUserChanged)
                  midObject.value =
                    (parseFloat(minMaxValue.min) +
                      parseFloat(minMaxValue.max)) /
                    2;

                format.name = fieldName(findField);

                updatecfObjectOptions(_propKey, index, format);
              }
            }
          }
        });
      }
    }
  };

  useEffect(() => {
    const makeServiceCall = async () => {
      const axesValues1: any = JSON.parse(JSON.stringify(chartProp.chartAxes));

      /*	To sort chart data	based on field name	*/
      const sortChartData = (chartData: any[]): any[] => {
        let result: any[] = [];

        if (chartData && chartData.length > 0) {
          let _zones: any = axesValues1.filter(
            (zones: any) => zones.name !== "Filter"
          );
          //let _zonesFields:any = [];
          // let _fieldTempObject: any = {};
          let _chartFieldTempObject: any = {};

          /*	Find and return field's new name	*/
          const findFieldIndexName = (name: string, i: number = 2): string => {
            if (_chartFieldTempObject[`${name}_${i}`] !== undefined) {
              i++;
              return findFieldIndexName(name, i);
            } else {
              return `${name}_${i}`;
            }
          };

          _zones.forEach((zoneItem: any) => {
            zoneItem.fields.forEach((field: any) => {
              let _nameWithAgg: string = "";

              _nameWithAgg = field.displayname;

              if (_chartFieldTempObject[field.fieldname] !== undefined) {
                let _name = findFieldIndexName(field.fieldname);

                field["NameWithIndex"] = _name;
                _chartFieldTempObject[_name] = "";
                // Logger("info", "NameWithIndex", field);
              } else {
                field["NameWithIndex"] = field.fieldname;
                _chartFieldTempObject[field.fieldname] = "";
                // Logger("info", "NameWithIndex", field);
              }

              // if (_fieldTempObject[_nameWithAgg] === undefined) {
              field["NameWithAgg"] = _nameWithAgg;
              //_fieldTempObject[_nameWithAgg] = "";
              // Logger("info", "NameWithAgg", field);
              //}
            });
          });

          chartData.forEach((data: any) => {
            let _chartDataObj: any = {};

            _zones.forEach((zoneItem: any) => {
              zoneItem.fields.forEach((field: any) => {
                _chartDataObj[field.NameWithAgg] = data[field.NameWithIndex];
              });
            });

            Logger("info", "_chartDataObj", _chartDataObj);
            result.push(_chartDataObj);
          });
        }

        return result;
      };

      let serverCall = false;
      if (
        chartProp.axesEdited ||
        chartGroup.chartFilterGroupEdited ||
        dashBoardGroup.dashBoardGroupEdited ||
        tabTileProps.isDashboardTileSwitched
      ) {
        //add resuse key in dynamic measure state
        if (chartProp.reUseData) {
          serverCall = false;
        } else {
          var minReq = checkMinRequiredCards(
            chartProp,
            chartProperties.properties[_propKey].chartType
          );

          if (minReq) {
            serverCall = true;
            storeServerData(_propKey, "");
          } else {
            if (chartProperties.properties[_propKey].chartType === "richText") {
              updateChartDataForDm("");
            } else {
              updateChartData(_propKey, "");
            }
          }
        }
      }

      if (chartProp.chartType === "scatterPlot") {
        var combinedValuesForMeasure = { name: "Measure", fields: [] };
        var values1 = axesValues1[2].fields;
        var values2 = axesValues1[3].fields;
        var allValues = values1.concat(values2);
        combinedValuesForMeasure.fields = allValues;
        axesValues1.splice(2, 2, combinedValuesForMeasure);
      }

      if (
        chartProp.chartType === "heatmap" ||
        chartProp.chartType === "crossTab" ||
        chartProp.chartType === "boxPlot" ||
        chartProp.chartType === "bubbleMap"
      ) {
        var combinedValuesForDimension = { name: "Dimension", fields: [] };
        var values1 = axesValues1[1].fields;
        var values2 = axesValues1[2].fields;

        var allValues = values1.concat(values2);
        combinedValuesForDimension.fields = allValues;
        axesValues1.splice(1, 2, combinedValuesForDimension);
      }

      if (chartProp.chartType === "table") {
        var combinedValuesForDimension = { name: "Dimension", fields: [] };

        combinedValuesForDimension.fields = axesValues1[1].fields;

        if (axesValues1.length === 4) {
          axesValues1.splice(1, 2, combinedValuesForDimension);
        } else if (axesValues1.length === 3) {
          axesValues1.splice(1, 1, combinedValuesForDimension);
        }
      }

      const showErrorNotification = (type: AlertColor, message: string) => {
        setSeverity(type);
        setOpenAlert(true);
        setTestMessage(message);

        setTimeout(() => {
          setOpenAlert(false);
          setTestMessage("");
        }, 2000);
      };

      let serverData = [];

      if (serverCall || chartProp.chartType === "crossTab") {
        setLoading(true);
        serverData = await getChartData(
          axesValues1,
          chartProp,
          chartGroup,
          dashBoardGroup,
          _propKey,
          screenFrom,
          token,
          chartProperties.properties[_propKey].chartType,
          undefined,
          savedCalculations,
          showErrorNotification
        );

        Logger("info", "", serverData);

        // Dispatch action to store server data
        storeServerData(_propKey, serverData);
        if (chartProperties.properties[_propKey].chartType === "richText") {
          updateChartDataForDm(sortChartData(serverData));
        } else {
          updateChartData(_propKey, sortChartData(serverData));
        }
        setLoading(false);
      }
    };

    const compareArrays = (a: any, b: any) =>
      a.length === b.length &&
      a.every((element: string, index: number) => element === b[index]);

    const _checkGroupsNotSame = (_tabTile: string) => {
      if (
        tabState.tabs[tabTileProps.selectedTabId].tilesInDashboard.includes(
          _tabTile
        ) &&
        dashBoardGroup.groups.length > 0
      ) {
        let _tileGroups = chartGroup.tabTile[_tabTile];
        let _dashBoardTilesCount = 0;
        let _dashBoardTilesGroups: any = [];

        Object.keys(dashBoardGroup.filterGroupTabTiles).forEach((grp) => {
          if (dashBoardGroup.filterGroupTabTiles[grp].includes(_tabTile)) {
            _dashBoardTilesCount += 1;
            _dashBoardTilesGroups.push(grp);
          }
        });

        if (_tileGroups && _tileGroups.length !== _dashBoardTilesCount) {
          return false;
        }

        return compareArrays(_dashBoardTilesGroups, _tileGroups);
      } else {
        return true;
      }
    };

    if (screenFrom === "Dashboard") {
      /**
       * the chart Data is tored in  chartData of respective tabTile if chart type is not richText else stored in richText
       *
       * if screen is dashboard  get all the tabTileId are being displayed in dashboard
       * "tabTilesAndTheirFilters" object is created to store list of filters to be applied on a tabTileID
       * key->tabTileId ,value->list of filters
       *
       * for each tiles in dashboard
       *        iterate over filterGroupTabTiles(object stores the list of tiles(value) on wihich filtergroupID(key) will, be applied ) object to get the filterGroupIDs to br applied on  the current tile
       *            if a filter group is to be applied on a tile get list of filters  from chartFilterGroup  and store it
       *
       * get list of  tabTileID which does not have any filter group to be applied on it as filterPanels should be empty for those tiles
       *
       * now fetch data  for tiles and store them in respective global state
       */
      let payLoad: any[] = [];
      const tilesInDashboard = tabState.tabs[`${tabId}`].tilesInDashboard;
      const tabTilesAndTheirFilters: ITabTilesAndTheirFilters = {};

      tilesInDashboard.forEach((tabTileID: string) => {
        Object.keys(dashBoardGroup.filterGroupTabTiles).forEach(
          (filterGroupID: string) => {
            if (
              dashBoardGroup.filterGroupTabTiles[filterGroupID].includes(
                tabTileID
              )
            ) {
              let filters: IFilter[] = [];
              chartGroup.groups[filterGroupID].filters.forEach(
                (filter: any) => {
                  if (
                    filter.fieldtypeoption === "Pick List" &&
                    (filter.userSelection?.length === 0 ||
                      filter.userSelection?.includes("(All)"))
                  ) {
                    if (
                      filter.filterTypeTillDate === "enabled" &&
                      !filter.exprTypeTillDate
                    )
                      return;
                  }
                  filters.push(modifyFilter(filter, savedCalculations));
                }
              );
              if (filters.length > 0) {
                if (tabTilesAndTheirFilters[tabTileID]) {
                  tabTilesAndTheirFilters[tabTileID].push(...filters);
                } else {
                  tabTilesAndTheirFilters[tabTileID] = filters;
                }
              }
              // else {
              //   /** as there is no filters for filterGroup  current tile should be removed from array  */
              //   // const index=tilesHaveFiltersToBeAppliedOn.indexOf(tabTileID)
              //   // tilesHaveFiltersToBeAppliedOn.splice(index,1)
              // }
            }
          }
        );
      });

      const tabTileIDsWithoutFilterGroups = tilesInDashboard.filter(
        (tabTileID: string) => !(tabTileID in tabTilesAndTheirFilters)
      );

      Object.keys(tabTilesAndTheirFilters).forEach((tabTileID: string) => {
        if (chartProperties.properties[`${tabTileID}`].chartType === "richText")
          return;
        const chartProp: any =
          chartProperties.properties[`${tabTileID}`].chartType === "richText"
            ? dynamicMeasureState.dynamicMeasureProps?.[
            tabTileID.split(".")[0]
            ]?.[tabTileID.split(".")[1]]?.[
            `${tabTileID.split(".")[1]}.${dynamicMeasureState.selectedDynamicMeasureId
            }`
            ]
            : chartProperties.properties[`${tabTileID}`];
        const sortChartData = (chartData: any[]): any[] => {
          let result: any[] = [];
          let axesValues1 = JSON.parse(JSON.stringify(chartProp.chartAxes));
          if (chartData && chartData.length > 0) {
            let _zones: any = axesValues1.filter(
              (zones: any) => zones.name !== "Filter"
            );
            //let _zonesFields:any = [];
            // let _fieldTempObject: any = {};
            let _chartFieldTempObject: any = {};

            /*	Find and return field's new name	*/
            const findFieldIndexName = (
              name: string,
              i: number = 2
            ): string => {
              if (_chartFieldTempObject[`${name}_${i}`] !== undefined) {
                i++;
                return findFieldIndexName(name, i);
              } else {
                return `${name}_${i}`;
              }
            };

            _zones.forEach((zoneItem: any) => {
              zoneItem.fields.forEach((field: any) => {
                let _nameWithAgg: string = "";

                _nameWithAgg = field.displayname;

                if (_chartFieldTempObject[field.fieldname] !== undefined) {
                  let _name = findFieldIndexName(field.fieldname);

                  field["NameWithIndex"] = _name;
                  _chartFieldTempObject[_name] = "";
                  // Logger("info", "NameWithIndex", field);
                } else {
                  field["NameWithIndex"] = field.fieldname;
                  _chartFieldTempObject[field.fieldname] = "";
                  // Logger("info", "NameWithIndex", field);
                }

                // if (_fieldTempObject[_nameWithAgg] === undefined) {
                field["NameWithAgg"] = _nameWithAgg;
                //_fieldTempObject[_nameWithAgg] = "";
                // Logger("info", "NameWithAgg", field);
                //}
              });
            });

            chartData.forEach((data: any) => {
              let _chartDataObj: any = {};

              _zones.forEach((zoneItem: any) => {
                zoneItem.fields.forEach((field: any) => {
                  _chartDataObj[field.NameWithAgg] = data[field.NameWithIndex];
                });
              });

              Logger("info", "_chartDataObj", _chartDataObj);
              result.push(_chartDataObj);
            });
          }

          return result;
        };

        let serverCall = false;
        if (
          chartProp.axesEdited ||
          chartGroup.chartFilterGroupEdited ||
          dashBoardGroup.dashBoardGroupEdited ||
          tabTileProps.isDashboardTileSwitched
        ) {
          if (chartProp.reUseData) {
            serverCall = false;
          } else {
            var minReq = checkMinRequiredCards(
              chartProp,
              chartProperties.properties[tabTileID].chartType
            );

            if (minReq) {
              serverCall = true;
              storeServerData(tabTileID, "");
            } else {
              if (
                chartProperties.properties[tabTileID].chartType === "richText"
              ) {
                updateChartDataForDm("");
              } else {
                updateChartData(tabTileID, "");
              }
            }
          }
        }
        const filters = tabTilesAndTheirFilters[tabTileID];
        const chartFilters = chartProp.chartAxes.filter(
          (axes: AxesValuProps) => axes.name === "Filter"
        );
        const appliedChartFilters = chartFilters[0]?.fields;
        const payloadChartFilter: IFilter[] = [];
        appliedChartFilters?.forEach((_filter: any) => {
          if (
            _filter.fieldtypeoption === "Pick List" &&
            (_filter.userSelection?.length === 0 ||
              _filter.userSelection?.includes("(All)"))
          ) {
            if (
              _filter.filterTypeTillDate === "enabled" &&
              !_filter.exprTypeTillDate
            )
              return;
            payloadChartFilter.push(modifyFilter(_filter, savedCalculations));
          }
        });

        const filterPanels: IFilterPanel[] = [
          {
            panelName: "dashboardFilters",
            shouldAllConditionsMatch: true,
            filters: [...filters],
          },
        ];
        if (payloadChartFilter.length > 0) {
          filterPanels.push({
            panelName: "chartFilters",
            shouldAllConditionsMatch: !appliedChartFilters[0].any_condition_match,
            filters: payloadChartFilter
          });
        }
        let payLoad: any[] = [];
        const measures = chartProp.chartAxes.filter((axes: AxesValuProps) =>
          ["Measure", "X Axis", "Y Axis"].includes(axes.name)
        );
        if (
          ["funnel", "gauge", "simplecard", "richText"].includes(
            chartProperties.properties[`${tabTileID}`].chartType
          )
        ) {
          payLoad = [
            {
              dimensions: [],
              fields: [],
              filterPanels: filterPanels,
              filters: chartFilters.map((filter: any) => filter.fields),
              measures: measures.flatMap((measure: any) =>
                measure.fields.map((el: any) => ({
                  dataType: el.dataType,
                  uid: el.uId,
                  fieldName: el.fieldname,
                  displayName: el.displayname,
                  rollupDepth: false,
                  measureOrder: 1,
                  aggr: el.agg,
                  tableId: el.tableId,
                  ...getCalculationByUid(
                    el.SavedCalculationUUID,
                    savedCalculations
                  ),
                }))
              ),
            },
          ];
        } else {
          const dimensions = chartProperties.properties[
            `${tabTileID}`
          ].chartAxes.filter(
            (axes: AxesValuProps) =>
              !["Measure", "Filter", "X Axis", "Y Axis"].includes(axes.name)
          );
          const chartFilters = chartProperties.properties[
            `${tabTileID}`
          ].chartAxes.filter((axes: AxesValuProps) => axes.name === "Filter");
          payLoad = [
            {
              filters: chartFilters.flatMap((filter: any) => filter.fields),
              measures: measures.flatMap((measure: any) =>
                measure.fields.map((el: any) => ({
                  dataType: el.dataType,
                  uid: el.uId,
                  fieldName: el.fieldname,
                  displayName: el.displayname,
                  rollupDepth: false,
                  measureOrder: 1,
                  aggr: el.agg,
                  tableId: el.tableId,
                  ...getCalculationByUid(
                    el.SavedCalculationUUID,
                    savedCalculations
                  ),
                }))
              ),
              dimensions: dimensions.flatMap((axes: AxesValuProps) =>
                axes.fields.map((filter: any) => ({
                  dataType: filter.dataType,
                  uid: filter.uId,
                  fieldName: filter.fieldname,
                  displayName: filter.displayname,
                  tableId: filter.tableId,
                  rollupDepth: false,
                  timeGrain:
                    filter.timeGrain /*  PRAKASH 14Nov2024 Demo Changes  */,
                  ...getCalculationByUid(
                    filter.SavedCalculationUUID,
                    savedCalculations
                  ),
                }))
              ),
              fields: [],
              filterPanels: filterPanels,
            },
          ];
        }
        if (serverCall) {
          (async () => {
            const _selectedDS =
              chartProperties.properties[`${tabTileID}`].selectedDs;
            let url = "";
            if (_selectedDS.isFlatFileData) {
              if (link && link !== "") {
                url = `open-link/query?datasetid=${_selectedDS.id}&linkId=${link}`;
              } else {
                url = `query?datasetid=${_selectedDS.id}`;
              }
            } else {
              if (link && link !== "") {
                url = `open-link/query?dbconnectionid=${_selectedDS.connectionId}&datasetid=${_selectedDS.id}&workspaceId=${_selectedDS.workSpaceId}&linkId=${link}`;
              } else {
                url = `query?dbconnectionid=${_selectedDS.connectionId}&datasetid=${_selectedDS.id}&workspaceId=${_selectedDS.workSpaceId}`;
              }
            }
            setLoading(true);
            const res = await FetchData({
              checkToken: link === "",
              requestType: "withData",
              method: "POST",
              url: url,
              headers:
                link && link !== ""
                  ? {
                    "Content-Type": "application/json",
                    "X-TENANT-ID": "community",
                  }
                  : {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
              data: payLoad,
            });
            if (res.status) {
              storeServerData(tabTileID, res.data);
              if (
                chartProperties.properties[tabTileID].chartType === "richText"
              ) {
                updateChartDataForDm(sortChartData(res.data));
                const values = Object.values(res.data[0]);
                updateRichTextDynamicValue(
                  tabTileID,
                  getFormatedValue(chartProp.dynamicMeasureId, values[0])
                );
              } else {
                updateChartData(tabTileID, sortChartData(res.data));
              }
              setLoading(false);
            } else {
              Logger("error", "Get Table Data Error", res.data.message);
              setLoading(false);
            }
          })();
        }
      });
      tabTileIDsWithoutFilterGroups.forEach((tabTileID: string) => {
        if (chartProperties.properties[`${tabTileID}`].chartType === "richText")
          return;
        const chartProp: any =
          chartProperties.properties[`${tabTileID}`].chartType === "richText"
            ? dynamicMeasureState.dynamicMeasureProps?.[
            tabTileID.split(".")[0]
            ]?.[tabTileID.split(".")[1]]?.[
            `${tabTileID.split(".")[1]}.${dynamicMeasureState.selectedDynamicMeasureId
            }`
            ]
            : chartProperties.properties[`${tabTileID}`];

        const sortChartData = (chartData: any[]): any[] => {
          let result: any[] = [];
          let axesValues1 = JSON.parse(JSON.stringify(chartProp.chartAxes));
          if (chartData && chartData.length > 0) {
            let _zones: any = axesValues1.filter(
              (zones: any) => zones.name !== "Filter"
            );
            //let _zonesFields:any = [];
            // let _fieldTempObject: any = {};
            let _chartFieldTempObject: any = {};

            /*	Find and return field's new name	*/
            const findFieldIndexName = (
              name: string,
              i: number = 2
            ): string => {
              if (_chartFieldTempObject[`${name}_${i}`] !== undefined) {
                i++;
                return findFieldIndexName(name, i);
              } else {
                return `${name}_${i}`;
              }
            };

            _zones.forEach((zoneItem: any) => {
              zoneItem.fields.forEach((field: any) => {
                let _nameWithAgg: string = "";

                _nameWithAgg = field.displayname;

                if (_chartFieldTempObject[field.fieldname] !== undefined) {
                  let _name = findFieldIndexName(field.fieldname);

                  field["NameWithIndex"] = _name;
                  _chartFieldTempObject[_name] = "";
                  // Logger("info", "NameWithIndex", field);
                } else {
                  field["NameWithIndex"] = field.fieldname;
                  _chartFieldTempObject[field.fieldname] = "";
                  // Logger("info", "NameWithIndex", field);
                }

                // if (_fieldTempObject[_nameWithAgg] === undefined) {
                field["NameWithAgg"] = _nameWithAgg;
                //_fieldTempObject[_nameWithAgg] = "";
                // Logger("info", "NameWithAgg", field);
                //}
              });
            });

            chartData.forEach((data: any) => {
              let _chartDataObj: any = {};

              _zones.forEach((zoneItem: any) => {
                zoneItem.fields.forEach((field: any) => {
                  _chartDataObj[field.NameWithAgg] = data[field.NameWithIndex];
                });
              });

              Logger("info", "_chartDataObj", _chartDataObj);
              result.push(_chartDataObj);
            });
          }

          return result;
        };
        let serverCall = false;
        if (
          chartProp.axesEdited ||
          chartGroup.chartFilterGroupEdited ||
          dashBoardGroup.dashBoardGroupEdited ||
          tabTileProps.isDashboardTileSwitched
        ) {
          if (chartProp.reUseData) {
            serverCall = false;
          } else {
            var minReq = checkMinRequiredCards(
              chartProp,
              chartProperties.properties[tabTileID].chartType
            );

            if (minReq) {
              serverCall = true;
              storeServerData(tabTileID, "");
            } else {
              if (
                chartProperties.properties[tabTileID].chartType === "richText"
              ) {
                updateChartDataForDm("");
              } else {
                updateChartData(tabTileID, "");
              }
            }
          }
        }
        const measures = chartProp.chartAxes.filter((axes: AxesValuProps) =>
          ["Measure", "X Axis", "Y Axis"].includes(axes.name)
        );
        const filterPanels: IFilterPanel[] = [];
        const chartFilters = chartProp.chartAxes.filter(
          (axes: AxesValuProps) => axes.name === "Filter"
        );
        const appliedChartFilters = chartFilters[0]?.fields;
        const payloadChartFilter: IFilter[] = [];
        appliedChartFilters?.forEach((_filter: any) => {
          if (
            _filter.fieldtypeoption === "Pick List" &&
            (_filter.userSelection?.length === 0 ||
              _filter.userSelection?.includes("(All)"))
          ) {
            if (
              _filter.filterTypeTillDate === "enabled" &&
              !_filter.exprTypeTillDate
            )
              return;
            payloadChartFilter.push(modifyFilter(_filter, savedCalculations));
          }
        });
        if (payloadChartFilter.length > 0) {
          filterPanels.push({
            panelName: "chartFilters",
            shouldAllConditionsMatch: !appliedChartFilters[0].any_condition_match,
            filters: payloadChartFilter
          });
        }
        if (
          ["funnel", "gauge", "simplecard", "richText"].includes(
            chartProperties.properties[`${tabTileID}`].chartType
          )
        ) {
          payLoad = [
            {
              dimensions: [],
              fields: [],
              filterPanels: filterPanels,
              filters: chartFilters.flatMap((filter: any) => filter.fields),
              measures: measures.flatMap((measure: any) =>
                measure.fields.map((el: any) => ({
                  dataType: el.dataType,
                  uid: el.uId,
                  fieldName: el.fieldname,
                  displayName: el.displayname,
                  rollupDepth: false,
                  measureOrder: 1,
                  aggr: el.agg,
                  tableId: el.tableId,
                  ...getCalculationByUid(
                    el.SavedCalculationUUID,
                    savedCalculations
                  ),
                }))
              ),
            },
          ];
        } else {
          const dimensions = chartProperties.properties[
            `${tabTileID}`
          ].chartAxes.filter(
            (axes: AxesValuProps) =>
              !["Measure", "Filter", "X Axis", "Y Axis"].includes(axes.name)
          );

          payLoad = [
            {
              filters: chartFilters.map((filter: any) => filter.fields),
              measures: measures.flatMap((measure: any) =>
                measure.fields.map((el: any) => ({
                  dataType: el.dataType,
                  uid: el.uId,
                  fieldName: el.fieldname,
                  displayName: el.displayname,
                  rollupDepth: false,
                  measureOrder: 1,
                  aggr: el.agg,
                  tableId: el.tableId,
                  ...getCalculationByUid(
                    el.SavedCalculationUUID,
                    savedCalculations
                  ),
                }))
              ),
              dimensions: dimensions.flatMap((axes: AxesValuProps) =>
                axes.fields.map((filter: any) => ({
                  dataType: filter.dataType,
                  uid: filter.uId,
                  fieldName: filter.fieldname,
                  displayName: filter.displayname,
                  tableId: filter.tableId,
                  rollupDepth: false,
                  timeGrain:
                    filter.timeGrain /*  PRAKASH 14Nov2024 Demo Changes  */,
                  ...getCalculationByUid(
                    filter.SavedCalculationUUID,
                    savedCalculations
                  ),
                }))
              ),
              fields: [],
              filterPanels: filterPanels,
            },
          ];
        }
        if (serverCall) {
          (async () => {
            const _selectedDS =
              chartProperties.properties[`${tabTileID}`].selectedDs;
            let url = "";
            if (_selectedDS.isFlatFileData) {
              url = `query?datasetid=${_selectedDS.id}`;
            } else {
              url = `query?dbconnectionid=${_selectedDS.connectionId}&datasetid=${_selectedDS.id}&workspaceId=${_selectedDS.workSpaceId}`;
            }
            setLoading(true);
            const res = await FetchData({
              requestType: "withData",
              method: "POST",
              url: url,
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              data: payLoad,
            });
            if (res.status) {
              storeServerData(tabTileID, res.data);
              if (
                chartProperties.properties[tabTileID].chartType === "richText"
              ) {
                updateChartDataForDm(sortChartData(res.data));
                const values = Object.values(res.data[0]);
                updateRichTextDynamicValue(
                  tabTileID,
                  getFormatedValue(chartProp.dynamicMeasureId, values[0])
                );
              } else {
                updateChartData(tabTileID, sortChartData(res.data));
              }
              setLoading(false);
            } else {
              Logger("error", "Get Table Data Error", res.data.message);
              setLoading(false);
            }
          })();
        }
      });
    } else {
      if (
        tabTileProps.previousTabId === 0 ||
        tabTileProps.previousTileId === 0 ||
        // &&
        // !_checkGroupsNotSame(_propKey)
        chartProp.axesEdited ||
        chartGroup.chartFilterGroupEdited ||
        dashBoardGroup.dashBoardGroupEdited
      ) {
        const debouncedMakeServiceCall = debounce(makeServiceCall, 1000);
        if (chartProp.chartType === "crossTab") {
          debouncedMakeServiceCall();
        } else makeServiceCall();
      }
    }

    resetStore();
  }, [
    chartProp.chartAxes,
    chartProp.chartType,
    chartProp.filterRunState,

    chartGroup,
    dashBoardGroup.dashBoardGroupEdited,
    tabTileProps.isDashboardTileSwitched,
  ]);

  useEffect(() => {
    updateConditionalFormattingMinMax();
  }, [chartControls.properties[_propKey].chartData]);

  const resetStore = () => {
    toggleAxesEdit(_propKey);
    reUseOldData(_propKey);

    chartFilterGroupEdited(false);
    dashBoardFilterGroupsEdited(false);
    setDashTileSwitched(false);
  };

  return (
    <>
      <NotificationDialog
        openAlert={openAlert}
        severity={severity}
        testMessage={testMessage}
        onCloseAlert={() => {
          setOpenAlert(false);
          setTestMessage("");
        }}
      />
      <div className="charAxesArea">{loading ? <LoadingPopover /> : null}</div>
    </>
  );
};

const mapStateToProps = (
  state: ChartPropertiesStateProps &
    TabTileStateProps2 &
    TileRibbonStateProps &
    isLoggedProps &
    ChartFilterGroupStateProps &
    DashBoardFilterGroupStateProps,

  ownProps: any
) => {
  const { tabId, tileId } = ownProps;
  var _propKey: string = `${tabId}.${tileId}`;
  return {
    tabTileProps: state.tabTileProps,
    tileState: state.tileState,
    tabState: state.tabState,
    chartControls: state.chartControls,
    calculations: state.calculations,

    // userFilterGroup: state.userFilterGroup,
    chartProperties: state.chartProperties,
    token: state.isLogged.accessToken,
    chartGroup: state.chartFilterGroup,
    dashBoardGroup: state.dashBoardFilterGroup,
    dynamicMeasureState: state.dynamicMeasuresState,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<any>) => {
  return {
    updateRichTextDynamicValue: (propKey: string, value: string | number) =>
      dispatch(updateRichTextDynamicValue(propKey, value)),
    storeServerData: (propKey: string, serverData: any) =>
      dispatch(storeServerData(propKey, serverData)),
    updateChartData: (propKey: string, chartData: any) =>
      dispatch(updateChartData(propKey, chartData)),
    toggleAxesEdit: (propKey: string) =>
      dispatch(toggleAxesEdited(propKey, false)),
    reUseOldData: (propKey: string) => dispatch(canReUseData(propKey, false)),
    chartFilterGroupEdited: (isEdited: boolean) =>
      dispatch(chartFilterGroupEdited(isEdited)),
    dashBoardFilterGroupsEdited: (isEdited: boolean) =>
      dispatch(dashBoardFilterGroupsEdited(isEdited)),
    setDashTileSwitched: (isSwitched: boolean) =>
      dispatch(setDashTileSwitched(isSwitched)),
    updateChartDataForDm: (chartData: any) =>
      dispatch(updateChartDataForDm(chartData)),
    updatecfObjectOptions: (propKey: string, removeIndex: number, item: any) =>
      dispatch(updatecfObjectOptions(propKey, removeIndex, item)),
    deleteTablecf: (propKey: string, index: number) =>
      dispatch(deleteTablecf(propKey, index)),
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
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ChartData);