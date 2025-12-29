import React, { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardActions,
    Typography,
    Button,
    Grid,
    Box,
    Stack,
} from "@mui/material";
import { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType } from "docx";
import { saveAs } from "file-saver";
import { getAllAgrement } from "../../services/services";
import { logo } from "../../Image/Image";
import { useNavigate } from "react-router-dom";

interface Agreement {
    id: number;
    hotelName: string;
    hotelAddress: string;
    agreementDate: string;
    fullAgreementText: string;
    hotelSignature?: string;
    huts4uSignature?: string;
}

const AgreementCards: React.FC = () => {
    const navigate = useNavigate();
    const [agreements, setAgreements] = useState<Agreement[]>([]);

    useEffect(() => {
        const payLoad = {
            data: { filter: "" },
            page: 0,
            pageSize: 400,
            order: [["createdAt", "ASC"]],
        };

        getAllAgrement(payLoad)
            .then((res: any) => {
                setAgreements(res?.data?.data?.rows ?? []);
            })
            .catch((err) => console.log(err));
    }, []);

    const fetchImageBuffer = async (imageUrl: string) => {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        return arrayBuffer;
    };

    const handleDownload = async (agreement: Agreement) => {
        try {
            const documentChildren: any[] = [
                new Paragraph({ text: "" }), // optional spacing
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `AGREEMENT BETWEEN HUTS4U AND ${agreement.hotelName.toUpperCase()}`,
                            bold: true,
                            size: 28,
                            font: "Times New Roman",
                        }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Hotel Address: ${agreement.hotelAddress}`,
                            size: 24,
                            font: "Times New Roman",
                        }),
                    ],
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Agreement Date: ${agreement.agreementDate}`,
                            size: 24,
                            font: "Times New Roman",
                        }),
                    ],
                    spacing: { after: 200 },
                }),
                ...agreement.fullAgreementText.split("\n").map(
                    (line) =>
                        new Paragraph({
                            children: [
                                new TextRun({ text: line, size: 24, font: "Times New Roman" }),
                            ],
                            spacing: { after: 100 },
                        })
                ),
            ];

            const doc = new Document({
                sections: [{ children: documentChildren }],
            });

            const blob = await Packer.toBlob(doc);
            saveAs(blob, `${agreement.hotelName}_Agreement.docx`);
        } catch (error) {
            console.error("Error generating document:", error);
            alert("Failed to generate document. Please try again.");
        }
    };


    const handleAddNewAgreement = () => {
        // Redirect to Add Agreement page or open modal
        navigate("/admin/add-agreement"); // Change to your route
    };

    return (
        <Box sx={{ p: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" gutterBottom>
                    Agreements
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddNewAgreement}
                >
                    Add New Agreement
                </Button>
            </Stack>

            <Grid container spacing={3}>
                {agreements.map((agreement) => (
                    <Grid item xs={12} sm={6} md={4} key={agreement.id}>
                        <Card elevation={3}>
                            <CardContent>
                                <Typography variant="h6">{agreement.hotelName}</Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {agreement.hotelAddress}
                                </Typography>
                                <Typography variant="body2">
                                    Date: {agreement.agreementDate}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button
                                    size="small"
                                    color="primary"
                                    variant="contained"
                                    onClick={() => handleDownload(agreement)}
                                >
                                    Download Agreement
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default AgreementCards;
