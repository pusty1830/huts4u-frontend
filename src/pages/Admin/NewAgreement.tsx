import React, { useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
    Grid,
    TextField,
    Button,
    Paper,
    Typography,
    Box,
} from "@mui/material";
import { logo } from "../../Image/Image";
import { addAgreement, docsUpload } from "../../services/services";
import { CloudUpload } from "@mui/icons-material";
import { toast } from "react-toastify";

const NewAgreement = () => {

    const initialValues = {
        hotelName: "",
        hotelAddress: "",
        agreementDate: new Date().toISOString().split("T")[0],
        huts4uSignature: "", // uploaded image URL
        hotelSignature: "", // uploaded image URL
        authorizedSignatoryName: "", // new
        authorizedSignatoryTitle: "", // new
    };

    const validationSchema = Yup.object({
        hotelName: Yup.string().required("Hotel name is required"),
        hotelAddress: Yup.string().required("Hotel address is required"),
        huts4uSignature: Yup.string().required("HUTS4U signature is required"),
        hotelSignature: Yup.string().required("Hotel signature is required"),
        authorizedSignatoryName: Yup.string().required("Signatory name is required"),
        authorizedSignatoryTitle: Yup.string().required("Signatory title is required"),
    });

    const AGREEMENT_TEMPLATE = `
AGREEMENT (TERMS AND CONDITIONS) BETWEEN HOTEL BOOKING COMPANY (HUTS4U) AND HOTELS

This Agreement ("Agreement") is made and entered into on this {agreementDate}, by and between:

HUTS4U, a company incorporated under the laws of India, Odisha with its registered office at Plot No 370/10537, New Pokhran Village, Chandrasekharpur, Bhubaneswar, 751016 (hereinafter referred to as "HUTS4U" or "The Company").

AND

{hotelName}, a hotel/entity incorporated under the laws of India, Odisha with its registered office at {hotelAddress}, (hereinafter referred to as "The Hotel").

(HUTS4U and The Hotel hereinafter collectively referred to as "the Parties" and individually as "Party").

WHEREAS:
•	HUTS4U operates an online hotel booking platform (hereinafter referred to as "the Platform") that facilitates reservations for various hotels to customers.
•	The Hotel owns and operates hotel properties and desires to list its accommodations on HUTS4U's Platform to increase its reach and bookings.
•	The Parties desire to enter into an agreement setting forth the terms and conditions under which The Hotel will list its accommodations on the Platform and HUTS4U will facilitate bookings for The Hotel.
NOW, THEREFORE, in consideration of the mutual covenants and promises contained herein, the Parties agree as follows:
________________________________________


1. DEFINITIONS
•	"Platform": Refers to HUTS4U's website, mobile applications, and any other online or offline channels through which HUTS4U facilitates hotel bookings.
•	"Customer": Refers to any individual or entity that makes a booking through the HUTS4U Platform for The Hotel's accommodations.
•	"Booking": A confirmed reservation for accommodation at The Hotel made by a Customer through the HUTS4U Platform.
•	"Room Night": One room booked for one night.
•	"Commission": The percentage of the Room Rate payable by The Hotel to HUTS4U for each confirmed Booking.
•	"Room Rate": The price of a room night, exclusive of taxes, service charges, or any additional services.
•	"Force Majeure": An event beyond the reasonable control of a Party, including but not limited to acts of God, war, terrorism, natural disasters, epidemics, pandemics, government regulations, or other emergencies making performance impossible or impractical.
________________________________________
2. SCOPE OF AGREEMENT
2.1. HUTS4U agrees to list The Hotel's available rooms and services on its Platform, making them accessible to potential Customers.
4 2.2. The Hotel agrees to make its rooms and services available for booking through the HUTS4U Platform in accordance with the terms and conditions of this Agreement.
________________________________________
3. HOTEL'S RESPONSIBILITIES
3.1. Information Accuracy and Updates: The Hotel shall provide HUTS4U with accurate, complete, and up-to-date information regarding its property, including but not limited to: * Room types, descriptions, and amenities. * Current Room Rates, including any special offers, promotions, or package deals. * Real-time room availability (inventory). * High-resolution images and videos of the property. * Cancellation policies, check-in/check-out times, and other relevant terms for guests. * Any changes to the above information must be communicated to HUTS4U promptly, and updated on the designated hotel portal/extranet.
3.2. Rate Parity: The Hotel agrees to maintain rate parity, ensuring that the Room Rates offered on the HUTS4U Platform are at least as favorable as those offered on the Hotel's own website or any other booking channel (online or offline) for the same room type, dates, and booking conditions. Any exceptions or specific negotiated rates will be mutually agreed upon in writing.
3.3. Honoring Bookings: The Hotel shall honor all confirmed Bookings made through the HUTS4U Platform. In case of any unforeseen circumstances preventing The Hotel from honoring a confirmed Booking (e.g., overbooking, maintenance issues), The Hotel shall: * Immediately notify HUTS4U and the Customer. * Arrange for comparable or better alternative accommodation at a nearby property, at its own cost and expense. * Bear any additional costs incurred by the Customer due to such relocation (e.g., transportation). * Indemnify HUTS4U against any claims, damages, or losses arising from the Hotel's inability to honor a booking.
3.4. Guest Experience: The Hotel shall provide a high standard of service and hospitality to all Customers who book through the HUTS4U Platform, consistent with its general service standards. The Hotel shall promptly address any guest complaints or concerns raised by Customers referred by HUTS4U.
3.5. Legal Compliance: The Hotel shall possess and maintain all necessary licenses, permits, and permissions required by applicable laws and regulations for operating its hotel business. The Hotel shall comply with all local, state, and national laws, rules, and regulations, including but not limited to those related to health, safety, and taxation.
3.6. Invoicing and Payment: The Hotel shall issue invoices directly to the Customer for the accommodation services and any additional services availed during their stay, unless otherwise specified in this Agreement.
________________________________________
4. HUTS4U'S RESPONSIBILITIES
4.1. Platform Listing: HUTS4U shall prominently list The Hotel's property on its Platform, utilizing the information and media provided by The Hotel.
4.2. Marketing and Promotion: HUTS4U shall actively promote The Hotel's accommodations through its various marketing channels, which may include social media, email newsletters, and targeted advertising campaigns, at its sole discretion.
4.3. Booking Confirmation: HUTS4U shall transmit Booking details to The Hotel in a mutually agreed-upon format (e.g., email, extranet access) and confirm the Booking to the Customer.
4.4. Customer Support (Platform-related): HUTS4U will provide customer support for issues directly related to the booking process on its Platform (e.g., technical issues with making a reservation, payment processing on the platform). Guest experience issues, once checked in, are the responsibility of The Hotel.
4.5. Data Protection: HUTS4U shall handle all customer and hotel data in accordance with its Privacy Policy and applicable data protection laws.
________________________________________
5. PRICING AND PAYMENT TERMS
5.1. Commission: The Hotel agrees to pay HUTS4U a commission of 13% on the Room Rate for each confirmed Booking that results in a completed stay at The Hotel.
5.2. Payment Calculation: The Commission shall be calculated based on the total Room Rate of the actualized bookings, excluding any taxes, service charges, or additional services purchased directly by the Customer at the Hotel.
5.3. Invoicing and Payment Schedule: HUTS4U shall be responsible for collecting booking amounts from Guests at the time of reservation. After deducting its agreed commission of 13% (thirteen percent), HUTS4U shall remit the balance booking amount to the Hotel’s designated bank account within forty-eight (48) hours of the Guest’s check-in date, subject to reconciliation of bookings and applicable cancellation policies.
5.4. Payment Method: Payments shall be made via [Bank Transfer/Online Payment Gateway] to the bank account specified by HUTS4U.
5.5. Taxes: All commissions are exclusive of applicable taxes (e.g., GST/VAT), which shall be borne by The Hotel in addition to the Commission.
________________________________________
6. CANCELLATION AND MODIFICATION POLICIES
6.1. Hotel Policies: The Hotel's cancellation and modification policies, as provided to HUTS4U and displayed on the Platform, shall apply to all Bookings.
6.2. Customer Cancellations/Modifications: Customers shall be able to cancel or modify their bookings through the HUTS4U Platform, subject to The Hotel's stated policies. HUTS4U will communicate such cancellations/modifications to The Hotel.
6.3. No-Shows: In the event of a "no-show" (where a Customer fails to arrive at The Hotel without prior cancellation), The Hotel may apply its standard no-show policy as communicated to HUTS4U and the Customer. Commission may still be applicable on the first night's rate for no-shows, subject to mutual agreement.
________________________________________
7. INTELLECTUAL PROPERTY
7.1. Hotel Content: The Hotel grants HUTS4U a non-exclusive, royalty-free, worldwide license to use, reproduce, display, and distribute the Hotel's name, logos, trademarks, images, descriptions, and other content provided by The Hotel for the purpose of marketing and facilitating bookings on the Platform.
7.2. Platform Content: HUTS4U retains all intellectual property rights in its Platform, including its software, design, trademarks, and content. The Hotel shall not copy, reproduce, modify, or create derivative works from any part of the HUTS4U Platform without prior written consent.
________________________________________
8. CONFIDENTIALITY
Both Parties agree to keep confidential all non-public information received from the other Party, including but not limited to business plans, customer data, pricing strategies, and technical specifications, and to use such information solely for the purpose of fulfilling their obligations under this Agreement. This obligation of confidentiality shall survive the termination of this Agreement.
________________________________________
9. REPRESENTATIONS AND WARRANTIES
9.1. Mutual Warranties: Each Party represents and warrants that:
•	It has the full power and authority to enter into and perform its obligations under this Agreement. 
•	The execution and performance of this Agreement will not violate any other agreement to which it is a party. 
•	It will comply with all applicable laws and regulations in its performance under this Agreement.
9.2. Hotel Warranties: The Hotel specifically represents and warrants that: * It has all necessary rights, licenses, and permits to operate its hotel and provide the services offered. * The information provided to HUTS4U is accurate, truthful, and not misleading. * It will provide services of acceptable quality and in accordance with industry standards.
________________________________________
10. INDEMNIFICATION
Each Party ("Indemnifying Party") agrees to indemnify, defend, and hold harmless the other Party ("Indemnified Party"), its affiliates, officers, directors, employees, and agents from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or in connection with:
•	Any breach of its representations, warranties, or covenants under this Agreement.
•	Any negligent or willful misconduct of the Indemnifying Party or its employees/agents.
•	Any third-party claim arising from the services provided or not provided by the Indemnifying Party.
________________________________________
11. LIMITATION OF LIABILITY
To the maximum extent permitted by law, neither Party shall be liable to the other for any indirect, incidental, consequential, special, punitive, or exemplary damages, including but not limited to lost profits, loss of data, or business interruption, arising out of or in connection with this Agreement, even if advised of the possibility of such damages. HUTS4U's total aggregate liability under this Agreement shall not exceed the total commission fees paid by The Hotel to HUTS4U in the 6 months preceding the event giving rise to the claim.
________________________________________
12. TERM AND TERMINATION
12.1. Term: This Agreement shall commence on the Effective Date and shall continue for an initial term of One year, unless terminated earlier in accordance with the provisions herein.
12.2. Renewal: This Agreement shall automatically renew for successive terms of one year unless either Party provides written notice of non-renewal at least 30 days prior to the end of the then-current term.
12.3. Termination for Cause: Either Party may terminate this Agreement immediately upon written notice if the other Party: * Commits a material breach of this Agreement and fails to remedy such breach within 15 days of receiving written notice thereof. * Becomes insolvent, files for bankruptcy, or ceases to conduct its business.
12.4. Termination for Convenience: Either Party may terminate this Agreement for convenience by providing 15 days' written notice to the other Party.
12.5. Effect of Termination: Upon termination of this Agreement for any reason: * The Hotel shall honor all existing Bookings made through the Platform prior to the termination date. * The Hotel shall pay HUTS4U all outstanding Commissions due up to the termination date. * HUTS4U shall remove The Hotel's listing from its Platform within a reasonable timeframe. * All provisions intended to survive termination, including but not limited to confidentiality, intellectual property, indemnification, and limitation of liability, shall remain in full force and effect.
________________________________________


13. GOVERNING LAW AND DISPUTE RESOLUTION
13.1. Governing Law: This Agreement shall be governed by and construed in accordance with the laws of India, specifically the laws of Odisha, without regard to its conflict of laws principles.
13.2. Dispute Resolution: Any dispute, controversy, or claim arising out of or relating to this Agreement, or the breach, termination, or invalidity thereof, shall first be attempted to be resolved amicably through good-faith negotiations between the Parties.
13.3. Arbitration: If the dispute cannot be resolved amicably within 90 days, it shall be submitted to binding arbitration in accordance with the rules of the [Specify Arbitration Body,  Indian Council of Arbitration (ICA)]. The arbitration shall be conducted in [City, Bhubaneswar, Odisha]. The language of the arbitration shall be English. The decision of the arbitrator(s) shall be final and binding on both Parties.
13.4. Jurisdiction: Subject to the arbitration clause above, the Courts in [City, Bhubaneswar, Odisha] shall have exclusive jurisdiction to hear any matter arising out of this Agreement.
________________________________________
14. MISCELLANEOUS
14.1. Entire Agreement: This Agreement constitutes the entire understanding and agreement between the Parties with respect to the subject matter hereof and supersedes all prior and contemporaneous agreements, understandings, and representations, whether written or oral.
14.2. Amendments: Any amendment or modification to this Agreement must be in writing and signed by duly authorized representatives of both Parties.
14.3. Notices: All notices or communications required or permitted under this Agreement shall be in writing and delivered by [email with read receipt/registered mail/courier] to the addresses specified at the beginning of this Agreement, or to such other address as a Party may designate by written notice.
14.4. Severability: If any provision of this Agreement is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.
14.5. Waiver: No waiver of any provision of this Agreement shall be effective unless in writing and signed by the Party granting the waiver. A waiver of any breach shall not constitute a waiver of any subsequent breach.
14.6. Relationship of Parties: The Parties are independent contractors. Nothing in this Agreement shall be construed as creating a partnership, joint venture, agency, or employment relationship between the Parties. Neither Party has the authority to bind the other Party or to incur any obligations on its behalf.
14.7. Assignment: Neither Party may assign or transfer its rights or obligations under this Agreement without the prior written consent of the other Party, except that HUTS4U may assign this Agreement to an affiliate or in connection with a merger, acquisition, or sale of all or substantially all of its assets.





________________________________________
IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date first written above.
FOR HUTS4U:
________________________________________
[Ram Naresh Das] [Co-founder]

FOR [ Hotel Name]:
________________________________________
[Authorized signatory Name] [ Title]












HOTEL BOOKING COMPANY TIE UP WITH HOTELS 
Hotel booking companies, often referred to as Online Travel Agencies (OTAs), enter into various types of agreements with hotels to list their inventory and facilitate bookings. These partnerships are crucial for both parties: hotels gain wider visibility and access to a global customer base, while OTAs earn commissions and provide a comprehensive booking platform for travelers.
Here's a breakdown of the common types of agreements and key aspects of their tie-ups:
Common Types of Agreements/Models:
1.	Commission-Based (Retail Model):
o	How it works: This is the most prevalent model. The hotel sets its room rates, and the OTA displays them on its platform. When a booking is made through the OTA, the hotel pays a pre-agreed commission (typically 10-30% of the room rate) to the OTA.
o	Benefits for Hotels: Low risk (only pay for confirmed bookings), wider reach, marketing exposure.
o	Considerations for Hotels: High commission fees can impact profit margins.
2.	Merchant Model (Wholesale/Net Rate Model):
o	How it works: The hotel provides rooms to the OTA at a discounted wholesale or "net" rate. The OTA then marks up the price and sells the rooms to customers at a higher retail price, keeping the difference as its profit. The customer pays the OTA directly.
o	Benefits for Hotels: Guaranteed revenue for rooms sold, even at a discount; the OTA handles payment collection.
o	Considerations for Hotels: Less control over the final selling price; potential for brand dilution if the OTA sells at very low rates.
3.	Hybrid Model:
o	How it works: Some OTAs offer a combination of both commission and merchant models, allowing hotels flexibility based on their inventory and pricing strategies. For example, a hotel might use the commission model for standard bookings and the merchant model for distressed inventory or last-minute deals.
4.	Advertising/Listing Fee Model (Less Common for direct booking):
o	How it works: Instead of a per-booking commission, the hotel pays a flat fee to the OTA for listing its property for a certain period or for enhanced visibility (e.g., featured listings).
o	Benefits for Hotels: Predictable costs, greater control over pricing.
o	Considerations for Hotels: No guarantee of bookings for the fee paid. More common with metasearch engines than direct booking OTAs.
Key Clauses and Terms in Hotel-OTA Agreements:
•	Commission Rates/Net Rates: The core financial terms, specifying the percentage or fixed amount the OTA earns.
•	Rate Parity Clause: A common and often contentious clause. It obligates the hotel to offer the same or lower rates on the OTA's platform as it offers on its own website or other distribution channels. Hotels often try to negotiate flexibility here to encourage direct bookings.
•	Inventory Allocation: How many rooms and which room types the hotel makes available to the OTA. This often involves a "channel manager" system that synchronizes availability across all platforms.
•	Payment Terms: How and when the OTA remits payment to the hotel (for commission models) or how the customer pays the OTA (for merchant models).
•	Cancellation and No-Show Policies: Agreed-upon terms for handling cancellations, modifications, and no-shows, including associated charges.
•	Content and Image Usage: Grants the OTA rights to use the hotel's descriptions, photos, and other content for marketing purposes.
•	Guest Communication: Defines who handles pre-arrival and post-stay communication with the guest (often the OTA for pre-arrival, and the hotel during the stay).
•	Dispute Resolution: Procedures for resolving conflicts between the hotel and the OTA.
•	Term and Termination: The duration of the agreement and conditions under which either party can terminate it (e.g., notice periods, breach of contract).
•	Reporting and Data Access: Details on the data and reports the OTA will provide to the hotel regarding bookings, guest demographics, and market insights.
•	Marketing and Promotions: How the hotel can participate in OTA-specific promotions, loyalty programs, or package deals.
•	Force Majeure: Clauses addressing unforeseen circumstances (e.g., natural disasters, pandemics) that might affect booking obligations.
Benefits of Hotel Tie-ups with OTAs:
•	Increased Visibility and Reach: OTAs expose hotels to a massive global audience they might not otherwise reach through their own marketing efforts.
•	Access to New Markets: OTAs can help hotels tap into international and niche markets.
•	Marketing and Advertising Support: Hotels benefit from the significant marketing spend of OTAs (SEO, SEM, social media campaigns).
•	Filling Empty Rooms: OTAs are excellent for selling distressed inventory or increasing occupancy during low seasons.
•	User-Friendly Booking Platforms: OTAs provide robust, multilingual, and mobile-friendly booking platforms that many hotels cannot afford to build or maintain themselves.
•	Credibility and Trust: Being listed on reputable OTAs can enhance a hotel's credibility through guest reviews and the OTA's brand recognition.
•	Data and Analytics: Some OTAs provide valuable market insights and competitive intelligence to hotels.
Challenges for Hotels:
•	High Commission Fees: Can significantly impact profit margins.
•	Rate Parity Restrictions: Limit a hotel's flexibility in offering better rates directly.
•	Dependency on Third Parties: Hotels can become overly reliant on OTAs for bookings, reducing direct customer relationships.
•	Limited Control over Guest Data: OTAs often own the customer relationship, making it harder for hotels to build loyalty.
•	Brand Dilution: Guests may associate their booking experience with the OTA rather than the hotel's brand.


Ultimately, hotels strategically balance their partnerships with OTAs to maximize visibility and occupancy while simultaneously investing in their direct booking channels to foster guest loyalty and improve profitability.


IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date first written above.

FOR HUTS4U:
[Ram Naresh Das] [Co-founder]
(Signature: Attached)

FOR {hotelName}:
[Authorized Signatory Name] [Title]
(Signature: Attached)

  `;

    const handleFileUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
        setFieldValue: any,
        fieldName: string
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append("files", file);

            const response = await docsUpload(formData); // returns string URL

            setFieldValue(fieldName, response.data.data.doc0 || response.data); // adapt based on API response
        } catch (error) {
            console.error("File upload failed:", error);
            alert("File upload failed. Try again.");
        }
    };

    const handleSubmit = async (values: any, { resetForm, setSubmitting }: any) => {
        try {
            const finalAgreement = AGREEMENT_TEMPLATE
                .replaceAll("{hotelName}", values.hotelName)
                .replaceAll("{hotelAddress}", values.hotelAddress)
                .replaceAll("{agreementDate}", values.agreementDate)
                .replaceAll("[Authorized Signatory Name]", values.authorizedSignatoryName)
                .replaceAll("[Title]", values.authorizedSignatoryTitle);

            const agreementData = {
                ...values,
                fullAgreementText: finalAgreement,
            };

            const res = await addAgreement(agreementData);
            toast.success(res?.data?.msg || "Agreement submitted successfully!");
            resetForm(); // reset form after success
        } catch (err) {
            toast.error("Failed to submit agreement!");
        } finally {
            setSubmitting(false); // enable button again
        }
    };

    return (
        <Paper sx={{ maxWidth: 900, margin: "auto", p: 4 }} elevation={3}>
            <Typography variant="h4" align="center" gutterBottom>
                Agreement (Terms and Conditions)
            </Typography>

            <Box display="flex" justifyContent="center" mb={3}>
                <img
                    src={logo} // replace with your logo path
                    alt="Company Logo"
                    style={{ height: 60 }} // adjust height as needed
                />
            </Box>
            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
            >
                {({ setFieldValue, values, errors, touched, isSubmitting }) => (
                    <Form>
                        {/* Hotel Details */}
                        <Box mb={3}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Hotel Name"
                                        name="hotelName"
                                        fullWidth
                                        value={values.hotelName}
                                        onChange={(e) => setFieldValue("hotelName", e.target.value)}
                                        error={touched.hotelName && Boolean(errors.hotelName)}
                                        helperText={touched.hotelName && errors.hotelName}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Hotel Address"
                                        name="hotelAddress"
                                        fullWidth
                                        value={values.hotelAddress}
                                        onChange={(e) =>
                                            setFieldValue("hotelAddress", e.target.value)
                                        }
                                        error={touched.hotelAddress && Boolean(errors.hotelAddress)}
                                        helperText={touched.hotelAddress && errors.hotelAddress}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Agreement Date"
                                        name="agreementDate"
                                        type="date"
                                        fullWidth
                                        value={values.agreementDate}
                                        InputLabelProps={{ shrink: true }}
                                        disabled
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Authorized Signatory Name"
                                        name="authorizedSignatoryName"
                                        fullWidth
                                        value={values.authorizedSignatoryName}
                                        onChange={(e) => setFieldValue("authorizedSignatoryName", e.target.value)}
                                        error={touched.authorizedSignatoryName && Boolean(errors.authorizedSignatoryName)}
                                        helperText={touched.authorizedSignatoryName && errors.authorizedSignatoryName}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Authorized Signatory Title"
                                        name="Position in Hotel"
                                        fullWidth
                                        value={values.authorizedSignatoryTitle}
                                        onChange={(e) => setFieldValue("authorizedSignatoryTitle", e.target.value)}
                                        error={touched.authorizedSignatoryTitle && Boolean(errors.authorizedSignatoryTitle)}
                                        helperText={touched.authorizedSignatoryTitle && errors.authorizedSignatoryTitle}
                                    />
                                </Grid>

                            </Grid>
                        </Box>

                        {/* Agreement Preview */}
                        <Paper
                            sx={{
                                p: 2,
                                mb: 3,
                                height: 300,
                                overflowY: "auto",
                                whiteSpace: "pre-line",
                                backgroundColor: "#f5f5f5",
                            }}
                        >
                            {AGREEMENT_TEMPLATE.replaceAll(
                                "{hotelName}", values.hotelName || "[Hotel Name]"
                            ).replaceAll(
                                "{hotelAddress}", values.hotelAddress || "[Hotel Address]"
                            ).replaceAll(
                                "{agreementDate}", values.agreementDate
                            ).replaceAll(
                                "[Authorized Signatory Name]", values.authorizedSignatoryName || "[Authorized Signatory Name]"
                            ).replaceAll(
                                "[Title]", values.authorizedSignatoryTitle || "[Title]"
                            )}

                        </Paper>

                        {/* Signatures */}
                        {/* Signature Uploads */}
                        <Grid container spacing={3} mt={2}>
                            {/* HUTS4U Signature */}
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle1">Upload HUTS4U Signature</Typography>
                                <Button
                                    variant="outlined"
                                    component="label"
                                    startIcon={<CloudUpload />}
                                    sx={{ mt: 1 }}
                                >
                                    Choose File
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onChange={(e) =>
                                            handleFileUpload(e, setFieldValue, "huts4uSignature")
                                        }
                                    />
                                </Button>
                                {values.huts4uSignature && (
                                    <Box mt={2}>
                                        <img
                                            src={values.huts4uSignature}
                                            alt="HUTS4U Signature"
                                            style={{
                                                height: 100,
                                                border: "1px solid #ccc",
                                                borderRadius: 8,
                                                padding: 4,
                                            }}
                                        />
                                    </Box>
                                )}
                            </Grid>

                            {/* Hotel Signature */}
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle1">Upload Hotel Signature</Typography>
                                <Button
                                    variant="outlined"
                                    component="label"
                                    startIcon={<CloudUpload />}
                                    sx={{ mt: 1 }}
                                >
                                    Choose File
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onChange={(e) =>
                                            handleFileUpload(e, setFieldValue, "hotelSignature")
                                        }
                                    />
                                </Button>
                                {values.hotelSignature && (
                                    <Box mt={2}>
                                        <img
                                            src={values.hotelSignature}
                                            alt="Hotel Signature"
                                            style={{
                                                height: 100,
                                                border: "1px solid #ccc",
                                                borderRadius: 8,
                                                padding: 4,
                                            }}
                                        />
                                    </Box>
                                )}
                            </Grid>
                        </Grid>

                        {/* Submit */}
                        <Box textAlign="center" mt={2}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={isSubmitting} // disable while submitting
                            >
                                {isSubmitting ? "Submitting..." : "Submit Agreement"}
                            </Button>
                        </Box>
                    </Form>
                )}
            </Formik>
        </Paper>
    );
};

export default NewAgreement;
