import { useState } from "react";
import { connect } from "react-redux";
import "./chartStyle.css";
import { SketchPicker } from "react-color";
import SliderWithInput from "../SliderWithInput";
import { FormControl, MenuItem, Popover, Select } from "@mui/material";
import SwitchWithInput from "../SwitchWithInput";
import { Dispatch } from "redux";
import { updateCalendarStyleOptions } from "../../../redux/ChartPoperties/ChartControlsActions";
import { ChartOptionsProps, ChartOptionsStateProps } from "../CommonInterfaceForChartOptions";

const CalendarChartStyles = ({
	// state
	chartControls,
	tabTileProps,

	// dispatch
	updateCalendarStyleOptions,
}: ChartOptionsProps & {
	updateCalendarStyleOptions: (propKey: string, option: string, value: any) => void;
}) => {
	var propKey = `${tabTileProps.selectedTabId}.${tabTileProps.selectedTileId}`;
	var calStyle = chartControls.properties[propKey].calendarStyleOptions;
	const [isColorPopoverOpen, setColorPopOverOpen] = useState(false);

	return (
		<div className="optionsInfo">
			<div className="optionDescription" style={{ padding: "0 6% 5px 4%" }}>
				<label
					htmlFor="enableDisable"
					className="enableDisableLabel"
					style={{ marginRight: "10px", paddingLeft: "0" }}
				>
					Show SplitLine
				</label>
				<SwitchWithInput
					isChecked={calStyle.showSplitLine}
					onSwitch={() => {
						updateCalendarStyleOptions(
							propKey,
							"showSplitLine",
							!calStyle.showSplitLine
						);
					}}
				/>
			</div>
			{calStyle.showSplitLine ? (
				<>
					<div className="optionDescription">
						Color
						<div
							style={{
								height: "1.25rem",
								width: "75%",
								backgroundColor: calStyle.splitLineColor,
								color: calStyle.splitLineColor,
								border: "2px solid darkgray",
								margin: "auto",
								marginLeft: "1.05rem",
							}}
							onClick={() => {
								setColorPopOverOpen(!isColorPopoverOpen);
							}}
						>
							{"  "}
						</div>
					</div>
					<div className="optionDescription">Width</div>
					<SliderWithInput
						percent={true}
						sliderValue={calStyle.splitLineWidth}
						sliderMinMax={{ min: 0, max: 60, step: 1 }}
						changeValue={(value: any) =>
							updateCalendarStyleOptions(propKey, "splitLineWidth", value)
						}
					/>

					<div className="optionDescription">Line Type</div>
					<FormControl
						fullWidth
						size="small"
						style={{ fontSize: "12px", borderRadius: "4px" }}
					>
						<Select
							value={calStyle.splitLineType}
							variant="outlined"
							onChange={e => {
								updateCalendarStyleOptions(
									propKey,
									"splitLineType",
									e.target.value
								);
							}}
							sx={{
								fontSize: "12px",
								width: "96%",
								margin: "0 auto 0.5rem 0.3rem",
								backgroundColor: "white",
								height: "1.5rem",
								color: "#404040",
								"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
									borderColor: "#2bb9bb", // Set focused border color
								},
							}}
							MenuProps={{
								PaperProps: {
									sx: {
										"& .MuiMenuItem-root.Mui-selected": {
											backgroundColor: "rgba(43, 185, 187, 0.1) !important",  // Force background color												
										},
										"& .MuiMenuItem-root.Mui-selected:hover": {
											backgroundColor: "rgba(43, 185, 187, 0.2) !important",  // Change hover state for selected item
										}
									}
								}
							}}
						>
							<MenuItem value="solid" sx={{ padding: "2px 10px", fontSize: "12px" }}>
								Solid
							</MenuItem>
							<MenuItem value="dashed" sx={{ padding: "2px 10px", fontSize: "12px" }}>
								Dashed
							</MenuItem>
							<MenuItem value="dotted" sx={{ padding: "2px 10px", fontSize: "12px" }}>
								Dotted
							</MenuItem>
						</Select>
					</FormControl>
				</>
			) : null}
			<Popover
				open={isColorPopoverOpen}
				onClose={() => setColorPopOverOpen(false)}
				onClick={() => setColorPopOverOpen(false)}
				anchorReference="anchorPosition"
				anchorPosition={{ top: 350, left: 1300 }}
			>
				<div>
					<SketchPicker
						color={calStyle.splitLineColor}
						className="sketchPicker"
						width="16rem"
						// styles={{ padding: "0" }}
						onChangeComplete={color => {
							updateCalendarStyleOptions(propKey, "splitLineColor", color.hex);
						}}
						onChange={color =>
							updateCalendarStyleOptions(propKey, "splitLineColor", color.hex)
						}
						disableAlpha
					/>
				</div>
			</Popover>
		</div>
	);
};
const mapStateToProps = (state: ChartOptionsStateProps, ownProps: any) => {
	return {
		chartControls: state.chartControls,
		tabTileProps: state.tabTileProps,
	};
};

const mapDispatchToProps = (dispatch: Dispatch<any>) => {
	return {
		updateCalendarStyleOptions: (propKey: string, option: string, value: any) =>
			dispatch(updateCalendarStyleOptions(propKey, option, value)),
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(CalendarChartStyles);
