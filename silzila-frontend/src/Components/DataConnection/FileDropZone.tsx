import { useState } from "react";
import "./FlatFile.css";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CloseIcon from "@mui/icons-material/Close";
import { makeStyles } from "@mui/styles";
import createStyles from "@mui/styles/createStyles";
import Logger from "../../Logger";
import { FileDropZoneProps } from "./FlatFileInterfaces";
import { fontSize } from "../..";


const useStyles: any = makeStyles(() =>
	createStyles({
		root: {
			"& .MuiSvgIcon-root": {
				fontSize: "3rem",
				color: "#3b3a3a",
				margin: " 20px auto",
			},
		},
		uploadIcon: {
			fontSize: "2.5rem",
			color: "#5d5c5c",
			margin: " 10px auto",
		},
		closeIcon: {
			margin: "auto 0px auto 5px",
			// fontSize: "4px",
			maxHeight: "14px",
			maxWidth: "12px",
			"&:hover": {
				color: "red",
			},
		}
	})
);


const FileDropZone = ({ setSelectedFile, selectedFile, fileType}: FileDropZoneProps) => {
	// drag state
	const [dragActive, setDragActive] = useState<boolean>(false);

	const classes = useStyles();

	// handle drag events
	const handleDrag = function (e: any) {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setDragActive(true);
		} else if (e.type === "dragleave") {
			setDragActive(false);
		}
	};

	// triggers when file is dropped
	const handleDrop = function (e: any) {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);
		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			Logger("info", e.dataTransfer.files[0], "handleDrop");
			setSelectedFile(e.dataTransfer.files[0]);
		} 
	};

	// triggers when file is selected with click
	const handleChange = function (e: any) {
		e.preventDefault();
		if (e.target.files && e.target.files[0]) {
			Logger("info", e.target.files[0], "handleChange");
			setSelectedFile(e.target.files[0]);
      e.target.value = "";
		} 
	};

	return (
    <div>
      <form
        id="form-file-upload"
        onDragEnter={handleDrag}
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          type="file"
          id="input-file-upload"
          multiple={false}
          onChange={handleChange}
          accept={
            fileType === "excel"
              ? ".xlsx"
              : fileType === "json"
              ? ".json"
              : ".csv"
          }
        />

        <UploadFileIcon className={classes.uploadIcon} />

        <p style={{ fontSize: fontSize.medium, margin: "10px auto" }}>
          Drag and Drop your file here
        </p>

        <label htmlFor="input-file-upload" className="upload-button">
          Choose a file
        </label>

        <div
          style={{
            border: "1px solid transparent",
            height: "50px",
            textAlign: "center",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {selectedFile ? (
            <div className="fileNameCard">
              {selectedFile.name}
              <CloseIcon
                className={classes.closeIcon}
                onClick={() => setSelectedFile()}
              />
            </div>
          ) : null}

          {dragActive && (
            <div
              id="drag-file-element"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            ></div>
          )}
        </div>
      </form>
    </div>
  );
};

export default FileDropZone;
