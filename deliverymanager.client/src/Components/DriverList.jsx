import { useState, useEffect } from 'react';

import * as React from 'react';
import { styled } from '@mui/material/styles';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';


//const Item = styled(Paper)(({ theme }) => ({
//    backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
//    ...theme.typography.body2,
//    padding: theme.spacing(1),
//    textAlign: 'center',
//    color: theme.palette.text.secondary,
//  }));

function DriverList({ driver, data }) {
    const [driverLogs, setDriverLogs] = useState(data)

    return(
        <div>
            {driverLogs.map(delivery => (
                <Accordion key={driver.STOP}>
                    <AccordionSummary
                        expandIcon={<ArrowDownwardIcon />}
                        aria-controls="panel1-content"
                        id="panel1-header"
                    >
                        <Typography>{delivery.PRONUMBER} - {delivery.SHIPNAME}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box sx={{ flexGrow: 1 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={3}>
                                    <TextField
                                        id="outlined-basic"
                                        label="Driver Manifest Key:"
                                        defaultValue={delivery.MFSTKEY}
                                        fullWidth
                                        />
                                </Grid>
                                <Grid item xs={3}>
                                    <TextField
                                        id="outlined-basic"
                                        label="Status:"
                                        defaultValue={delivery.STATUS}
                                        fullWidth
                                        />
                                </Grid>
                                <Grid item xs={3}>
                                    <TextField
                                        id="outlined-basic"
                                        label="Last Update:"
                                        defaultValue={delivery.LASTUPDATE}
                                        fullWidth
                                        />
                                </Grid>
                                <Grid item xs={3}>
                                    <TextField
                                        id="outlined-basic"
                                        label="Manifest Number:"
                                        defaultValue={delivery.MFSTNUMBER}
                                        fullWidth
                                        />
                                </Grid>
                                <Grid item xs={3}>
                                    <TextField
                                        id="outlined-basic"
                                        label="Power Unit:"
                                        defaultValue={delivery.POWERUNIT}
                                        fullWidth
                                        />
                                </Grid>
                                <Grid item xs={3}>
                                    <TextField
                                        id="outlined-basic"
                                        label="Stop:"
                                        defaultValue={delivery.STOP}
                                        fullWidth
                                        />
                                </Grid>
                                <Grid item xs={3}>
                                    <TextField
                                        id="outlined-basic"
                                        label="Manifest Date:"
                                        defaultValue={delivery.MFSTDATE}
                                        fullWidth
                                        />
                                </Grid>
                                <Grid item xs={3}>
                                    <TextField
                                        id="outlined-basic"
                                        label="PRO Number:"
                                        defaultValue={delivery.PRONUMBER}
                                        fullWidth
                                        />
                                </Grid>
                                <Grid item xs={3}>
                                    <TextField
                                        id="outlined-basic"
                                        label="Shipper Name:"
                                        defaultValue={delivery.SHIPNAME}
                                        fullWidth
                                        />
                                </Grid>
                                <Grid item xs={3}>
                                    <TextField
                                        id="outlined-basic"
                                        label="Consignee Name:"
                                        defaultValue={delivery.CONSNAME}
                                        fullWidth
                                        />
                                </Grid>
                                <Grid item xs={3}>
                                    <TextField
                                        id="outlined-basic"
                                        label="Consignee Address:"
                                        defaultValue={delivery.CONSADD1}
                                        fullWidth
                                        />
                                </Grid>
                                <Grid item xs={3}>
                                    <TextField
                                        id="outlined-basic"
                                        label="Consignee Address 2:"
                                        defaultValue={delivery.CONSADD2}
                                        fullWidth
                                        />
                                </Grid>
                                <Grid item xs={3}>
                                    <TextField
                                        id="outlined-basic"
                                        label="Consignee City:"
                                        defaultValue={delivery.CONSCITY}
                                        fullWidth
                                        />
                                </Grid>
                                <Grid item xs={3}>
                                    <TextField
                                        id="outlined-basic"
                                        label="Consignee State:"
                                        defaultValue={delivery.CONSSTATE}
                                        fullWidth
                                        />
                                </Grid>
                                <Grid item xs={3}>
                                    <TextField
                                        id="outlined-basic"
                                        label="Consignee ZipCode:"
                                        defaultValue={delivery.CONSZIP}
                                        fullWidth
                                        />
                                </Grid>
                                <Grid item xs={3}>
                                    <TextField
                                        id="outlined-basic"
                                        label="Total Weight:"
                                        defaultValue={delivery.TTLWGT}
                                        fullWidth
                                        />
                                </Grid>
                                <Grid item xs={3}>
                                    <TextField
                                        id="outlined-basic"
                                        label="Total Pieces:"
                                        defaultValue={delivery.TTLPCS}
                                        fullWidth
                                        />
                                </Grid>
                                <Grid item xs={3}>
                                    <TextField
                                        id="outlined-basic"
                                        label="Total Yards:"
                                        defaultValue={delivery.TTLYDS}
                                        fullWidth
                                        />
                                </Grid>
                                <Grid item xs={3}>
                                    <TextField
                                        id="outlined-basic"
                                        label="Delivery Date:"
                                        defaultValue={delivery.DLVDDATE}
                                        fullWidth
                                        />
                                </Grid>
                                <Grid item xs={3}>
                                    <TextField
                                        id="outlined-basic"
                                        label="Delivery Time:"
                                        defaultValue={delivery.DLVTIME}
                                        fullWidth
                                        />
                                </Grid>
                                <Grid item xs={3}>
                                    <TextField
                                        id="outlined-basic"
                                        label="Delivered Pieces:"
                                        defaultValue={delivery.DLVDPCS}
                                        fullWidth
                                        />
                                </Grid>
                                <Grid item xs={3}>
                                    <TextField
                                        id="outlined-basic"
                                        label="Total Yards:"
                                        defaultValue={delivery.DLVDNOTE}
                                        fullWidth
                                        />
                                </Grid>
                            </Grid>
                        </Box>
                    </AccordionDetails>
                </Accordion>
            ))};
        </div>
    );
}

export default DriverList;