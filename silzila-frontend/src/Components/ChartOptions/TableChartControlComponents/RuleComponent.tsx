import { connect } from "react-redux";
import { Dispatch } from "redux";
import ShortUniqueId from "short-unique-id";
import {
	updatecfObjectOptions,
	updatecfObjectOptions1,
} from "../../../redux/ChartPoperties/ChartControlsActions";

import { Button, FormControl, MenuItem, Select } from "@mui/material";
import {
	CustomFontAndBgColor,
	GetInputField,
	StyleButtons,
	conditionTypes,
} from "../CommonComponents";
import { addConditionButtonStyle } from "./TableConditionalFormatting";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { SelectComponentStyle, menuItemStyle } from "../Labels/SnakeyLabelOptions";
import "./tablechartCF.css";
import { getContrastColor, generateRandomColorArray} from '../../CommonFunctions/CommonFunctions';
import { ColorSchemes } from "../../ChartOptions/Color/ColorScheme";

const RuleComponent = ({
	chartControls,
	tabTileProps,
	updatecfObjectOptions1,
	updatecfObjectOptions,
	format,
	i,
}: any) => {
	var propKey = `${tabTileProps.selectedTabId}.${tabTileProps.selectedTileId}`;
	var uId = new ShortUniqueId({ length: 8 });

	var chartThemes: any[];
	var chartControl: any = chartControls.properties[propKey];
	
	chartThemes = ColorSchemes.filter(el => {
		return el.name === chartControl.colorScheme;
	});

	let randomColors = generateRandomColorArray(15);
	let colors = chartThemes[0].colors;

	colors = [...colors, ...randomColors]

	const onUpdateRule = (updatedArray: any, columnName: string) => {
		const updatedValues = chartControls.properties[propKey].tableConditionalFormats.map(
			(column: any) => {
				if (column.name === columnName) {
					column.value = updatedArray;
				}
				return column;
			}
		);

		/* sending updatedValues as payload to update state*/
		updatecfObjectOptions1(propKey, updatedValues);
	};
	const onAddCondition = (format: any, index: number) => {
		let ruleCount = format.value?.length || 0;

		if(ruleCount >= colors.length){
			ruleCount = ruleCount - colors.length;
		}

		var obj = {
			id: uId(),
			isConditionSatisfied: false,
			conditionType: 1,
			target: null,
			minValue: null,
			maxValue: null,
			backgroundColor: colors[ruleCount],
			fontColor: getContrastColor(colors[ruleCount]),
			isBold: false,
			isItalic: false,
			isUnderlined: false,
			isCollapsed: true,
		};

		updatecfObjectOptions(propKey, index, {
			...format,
			value: [...format.value, obj],
		});
	};

	const onStylePropsChange = (id: string, option: string, value: any) => {
		const updatedArray = format.value.map((el: any) => {
			if (el.id === id) {
				el[option] = value;
			}
			return el;
		});
		onUpdateRule(updatedArray, format.name);
	};
	return (
		<div>
			<div style={{ display: "flex", flexDirection: "column" }}>
				{format.value.map((condition: any, i: number) => {
					return (
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								borderBottom: "2px solid rgba(224,224,224,1)",
								paddingBottom: "10px",
							}}
						>
							<div style={{ display: "flex", marginTop: "5px" }}>
								<span>Rule {i + 1}</span>
								<span className="expandLessMoreContainer">
									{condition.isCollapsed ? (
										<ExpandMoreIcon
											sx={{
												fontSize: "16px",
											}}
											onClick={() => {
												onStylePropsChange(
													condition.id,
													"isCollapsed",
													!condition.isCollapsed
												);
											}}
										/>
									) : (
										<ChevronRightIcon
											sx={{
												fontSize: "16px",
											}}
											onClick={() =>
												onStylePropsChange(
													condition.id,
													"isCollapsed",
													!condition.isCollapsed
												)
											}
										/>
									)}
								</span>
								<span className="deleteIconContainer">
									<DeleteOutlineOutlinedIcon
										sx={{ fontSize: "16px" }}
										onClick={() => {
											const filterdArray = format.value.filter((el: any) => {
												return el.id !== condition.id;
											});
											onUpdateRule(filterdArray, format.name);
										}}
									/>
								</span>
							</div>

							{condition.isCollapsed ? (
								<>
									<div style={{ flexDirection: "column" }}>
										<div>Condition</div>
										<FormControl
											fullWidth
											size="small"
											style={{
												fontSize: "12px",
												borderRadius: "4px",
												marginTop: "5px",
											}}
										>
											<Select
												value={condition.conditionType}
												variant="outlined"
												onChange={e => {
													onStylePropsChange(
														condition.id,
														"conditionType",
														e.target.value
													);
												}}
												sx={{
													...SelectComponentStyle,
													width: "100% !important",
													margin: "0 auto 0.5rem auto !important"													
												}}
											>
												{conditionTypes.map((item: any) => {
													return (
														<MenuItem
															value={item.id}
															key={item.id}
															sx={{
																textTransform: "capitalize",
																...menuItemStyle,
															}}
														>
															{item.value}
														</MenuItem>
													);
												})}
											</Select>
										</FormControl>
										<GetInputField
											condition={condition}
											onChangeValueProps={(option: string, value: any) => {
												onStylePropsChange(condition.id, option, value);
											}}
										/>
										<div
											style={{
												display: "flex",
												marginTop: "5px",
												marginLeft: "0px",
												justifyContent: "center"
											}}
										>
											<StyleButtons
												isBold={condition.isBold}
												isItalic={condition.isItalic}
												isUnderlined={condition.isUnderlined}
												onChangeStyleProps={(
													option: string,
													value: any
												) => {
													onStylePropsChange(condition.id, option, value);
												}}
											/>
											<CustomFontAndBgColor
												backgroundColor={condition.backgroundColor}
												fontColor={condition.fontColor}
												onChangeColorProps={(
													option: string,
													color: any,
													id: any
												) => {
													onStylePropsChange(id, option, color);
												}}
												id={condition.id}
											/>
										</div>
									</div>
								</>
							) : null}
						</div>
					);
				})}
			</div>

			<Button
				sx={{
					backgroundColor: "rgb(43, 185, 187)",
					height: "25px",
					width: "100%",
					color: "white",
					textTransform: "none",
					"&:hover": {
						backgroundColor: "rgb(43, 185, 187)",
					},	
				}}
				onClick={() => {
					onAddCondition(format, i);
				}}
			>
				Add Rule
			</Button>

			<div>
				<p className="noteStyle">*the last satisfied condition's style will be applied*</p>
			</div>
		</div>
	);
};

const mapStateToProps = (state: any) => {
	return {
		chartControls: state.chartControls,
		tabTileProps: state.tabTileProps,
	};
};

const mapDispatchToProps = (dispatch: Dispatch<any>) => {
	return {
		updatecfObjectOptions1: (propKey: string, item: any) =>
			dispatch(updatecfObjectOptions1(propKey, item)),
		updatecfObjectOptions: (propKey: string, removeIndex: number, item: any) =>
			dispatch(updatecfObjectOptions(propKey, removeIndex, item)),
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(RuleComponent);
