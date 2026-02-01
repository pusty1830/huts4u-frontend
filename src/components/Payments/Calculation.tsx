// // src/utils/priceCalculations.ts

// /**
//  * Calculate the complete price breakdown including all fees and taxes
//  * @param basePrice - The base room price (before any fees/taxes)
//  * @returns Object containing all price components
//  */
// export const calculatePriceBreakdown = (basePrice: number) => {
//     const numericBase = Number(basePrice) || 0;

//     if (!numericBase || numericBase <= 0) {
//         return {
//             basePrice: 0,
//             platformFee: 0,
//             gstOnBase: 0,
//             gstOnPlatform: 0,
//             gatewayFee: 0,
//             gstOnGateway: 0,
//             gstTotal: 0,
//             finalPrice: 0,
//         };
//     }

//     const gstOnBase = numericBase * 0.05;
//     const platformFeeBase = numericBase + gstOnBase;
//     const platformFee = platformFeeBase * 0.13;
//     const gstOnPlatform = platformFee * 0.18;
//     const amountBeforeGateway = numericBase + gstOnBase + platformFee + gstOnPlatform;
    
//     // Split 3.8% into three parts: 1.6%, 0.3%, 1.9% (each with 18% GST)
//     // Part 1: 1.6%
//     const gatewayFeePart1 = amountBeforeGateway * 0.016;
//     const gstOnGatewayPart1 = gatewayFeePart1 * 0.18;
    
//     // Part 2: 0.3% (calculated on amount after part 1)
//     const amountAfterPart1 = amountBeforeGateway + gatewayFeePart1 + gstOnGatewayPart1;
//     const gatewayFeePart2 = amountAfterPart1 * 0.003;
//     const gstOnGatewayPart2 = gatewayFeePart2 * 0.18;
    
//     // Part 3: 1.9% (calculated on amount after part 2)
//     const amountAfterPart2 = amountAfterPart1 + gatewayFeePart2 + gstOnGatewayPart2;
//     const gatewayFeePart3 = amountAfterPart2 * 0.019;
//     const gstOnGatewayPart3 = gatewayFeePart3 * 0.18;
    
//     // Total gateway fee and GST (backward compatible)
//     const gatewayFee = gatewayFeePart1 + gatewayFeePart2 + gatewayFeePart3;
//     const gstOnGateway = gstOnGatewayPart1 + gstOnGatewayPart2 + gstOnGatewayPart3;
    
//     const gstTotal = gstOnBase + gstOnPlatform + gstOnGateway;
//     const finalPrice = numericBase + platformFee + gstTotal;

//     return {
//         basePrice: numericBase,
//         platformFee,
//         gstOnBase,
//         gstOnPlatform,
//         gatewayFee,
//         gstOnGateway,
//         gstTotal,
//         finalPrice,
//     };
// };

// // Helper function to format INR currency
// export const formatINR = (val: number) =>
//     val.toLocaleString("en-IN", {
//         style: "currency",
//         currency: "INR",
//         minimumFractionDigits: 0,
//     });

// // Optional: Function to calculate total price for multiple rooms/nights
// export const calculateTotalPrice = (
//     basePrice: number,
//     roomsCount: number = 1,
//     nights: number = 1
// ) => {
//     const breakdown = calculatePriceBreakdown(basePrice);
//     const perRoomFinal = breakdown.finalPrice;
//     const perRoomBase = breakdown.basePrice;
//     const perRoomPlatform = breakdown.platformFee;
//     const perRoomGstTotal = breakdown.gstTotal;

//     const multiplier = roomsCount * nights;

//     return {
//         ...breakdown,
//         totalBase: +(perRoomBase * multiplier),
//         totalPlatform: +(perRoomPlatform * multiplier),
//         totalGst: +(perRoomGstTotal * multiplier),
//         totalFinal: +(perRoomFinal * multiplier),
//     };
// };

// export const calculatePriceBreakdown1 = (
//     basePrice: number,
//     mealPlanPrice: number = 0,
//     discounts: {
//         hotelDiscountValue: number;
//         hotelDiscountType: 'percentage' | 'flat' | null;
//         couponApplied: boolean;
//         couponValue: number;
//     }
// ) => {
//     const numericBase = Number(basePrice) || 0;
//     const numericMeal = Number(mealPlanPrice) || 0;

//     if (!numericBase || numericBase <= 0) {
//         return {
//             basePrice: 0,
//             mealPlanPrice: 0,
//             gstOnBase: 0,
//             platformFee: 0,
//             gstOnPlatform: 0,
//             convenienceFee: 0,
//             gstOnConvenience: 0,
//             totalWithoutDiscount: 0,
//             hotelDiscount: 0,
//             couponDiscount: 0,
//             totalDiscount: 0,
//             finalPrice: 0,
//         };
//     }

//     // Total taxable value (base + meal plan)
//     const totalTaxableValue = numericBase + numericMeal;

//     // 1. GST on base + meal (5%)
//     const gstOnBase = totalTaxableValue * 0.05;

//     // Amount after base GST
//     const amountAfterBaseGst = totalTaxableValue + gstOnBase;

//     // 2. Platform fee (13% on base + GST)
//     const platformFee = amountAfterBaseGst * 0.13;

//     // 3. GST on platform fee (18%)
//     const gstOnPlatform = platformFee * 0.18;

//     // 4. Subtotal before convenience
//     const subtotalBeforeConvenience =
//         totalTaxableValue + gstOnBase + platformFee + gstOnPlatform;

//     // Split 3.8% into three parts: 1.6%, 0.3%, 1.9% (each with 18% GST)
//     // Part 1: 1.6%
//     const convenienceFeePart1 = subtotalBeforeConvenience * 0.016;
//     const gstOnConveniencePart1 = convenienceFeePart1 * 0.18;
    
//     // Part 2: 0.3% (calculated on amount after part 1)
//     const amountAfterPart1 = subtotalBeforeConvenience + convenienceFeePart1 + gstOnConveniencePart1;
//     const convenienceFeePart2 = amountAfterPart1 * 0.003;
//     const gstOnConveniencePart2 = convenienceFeePart2 * 0.18;
    
//     // Part 3: 1.9% (calculated on amount after part 2)
//     const amountAfterPart2 = amountAfterPart1 + convenienceFeePart2 + gstOnConveniencePart2;
//     const convenienceFeePart3 = amountAfterPart2 * 0.019;
//     const gstOnConveniencePart3 = convenienceFeePart3 * 0.18;
    
//     // Total convenience fee and GST (backward compatible)
//     const convenienceFee = convenienceFeePart1 + convenienceFeePart2 + convenienceFeePart3;
//     const gstOnConvenience = gstOnConveniencePart1 + gstOnConveniencePart2 + gstOnConveniencePart3;

//     // 7. Total without discount
//     const totalWithoutDiscount =
//         subtotalBeforeConvenience + convenienceFee + gstOnConvenience;

//     // Calculate hotel discount
//     let hotelDiscount = 0;
//     if (discounts.hotelDiscountValue > 0 && discounts.hotelDiscountType) {
//         if (discounts.hotelDiscountType === 'percentage') {
//             // Percentage discount on total without discount
//             hotelDiscount = totalWithoutDiscount * (discounts.hotelDiscountValue / 100);
//         } else {
//             // Flat discount
//             hotelDiscount = Math.min(discounts.hotelDiscountValue, totalWithoutDiscount);
//         }
//     }

//     // Calculate coupon discount (5% on total without discount)
//     let couponDiscount = 0;
//     if (discounts.couponApplied) {
//         couponDiscount = totalWithoutDiscount * discounts.couponValue;
//     }

//     // Total discount
//     const totalDiscount = hotelDiscount + couponDiscount;

//     // Final price = total without discount - discounts
//     const finalPrice = totalWithoutDiscount - totalDiscount;

//     return {
//         basePrice: numericBase,
//         mealPlanPrice: numericMeal,
//         gstOnBase,
//         platformFee,
//         gstOnPlatform,
//         convenienceFee,
//         gstOnConvenience,
//         totalWithoutDiscount,
//         hotelDiscount,
//         couponDiscount,
//         totalDiscount,
//         finalPrice,
//     };
// };

// export const round2 = (n: number) => Math.round(n * 100) / 100;

// export const calculateInvoiceBreakdown = (finalAmount: number) => {
//     const discountPercentage = 0.05; // 5% discount
//     const serviceChargePercentage = 0.13; // 13% of Base Price WITH GST
//     const convenienceFeePercentages = [0.016, 0.003, 0.019]; // 1.6%, 0.3%, 1.9% (total 3.8%)

//     // Step 1: Calculate subtotal before discount
//     const subtotalBeforeDiscount = round2(finalAmount / (1 - discountPercentage));
//     const discountAmount = round2(subtotalBeforeDiscount * discountPercentage);

//     // Step 2: Find Base Price iteratively
//     let basePriceExclGST = round2(subtotalBeforeDiscount / 1.23965);
    
//     // Iterate to refine the calculation due to sequential fees
//     for (let i = 0; i < 5; i++) {
//         const baseCGST = round2(basePriceExclGST * 0.025);
//         const baseSGST = round2(basePriceExclGST * 0.025);
//         const baseTotal = round2(basePriceExclGST + baseCGST + baseSGST);

//         const serviceChargesExclGST = round2(baseTotal * serviceChargePercentage);
//         const serviceCGST = round2(serviceChargesExclGST * 0.09);
//         const serviceSGST = round2(serviceChargesExclGST * 0.09);
//         const serviceTotal = round2(serviceChargesExclGST + serviceCGST + serviceSGST);

//         // Calculate sequential convenience fees
//         let currentAmount = baseTotal + serviceTotal;
//         let totalConvenienceExclGST = 0;
//         let totalConvenienceCGST = 0;
//         let totalConvenienceSGST = 0;
        
//         for (const percentage of convenienceFeePercentages) {
//             const convenienceExclGST = round2(currentAmount * percentage);
//             const convenienceCGST = round2(convenienceExclGST * 0.09);
//             const convenienceSGST = round2(convenienceExclGST * 0.09);
            
//             totalConvenienceExclGST += convenienceExclGST;
//             totalConvenienceCGST += convenienceCGST;
//             totalConvenienceSGST += convenienceSGST;
            
//             currentAmount += convenienceExclGST + convenienceCGST + convenienceSGST;
//         }
        
//         const convenienceTotal = round2(totalConvenienceExclGST + totalConvenienceCGST + totalConvenienceSGST);
//         const calculatedSubtotal = round2(baseTotal + serviceTotal + convenienceTotal);
//         const calculatedFinal = round2(calculatedSubtotal * (1 - discountPercentage));
        
//         // Adjust base price
//         basePriceExclGST = round2(basePriceExclGST * (finalAmount / calculatedFinal));
//     }

//     // Final calculation with refined base price
//     const baseCGST = round2(basePriceExclGST * 0.025);
//     const baseSGST = round2(basePriceExclGST * 0.025);
//     const baseTotal = round2(basePriceExclGST + baseCGST + baseSGST);

//     const serviceChargesExclGST = round2(baseTotal * serviceChargePercentage);
//     const serviceCGST = round2(serviceChargesExclGST * 0.09);
//     const serviceSGST = round2(serviceChargesExclGST * 0.09);
//     const serviceTotal = round2(serviceChargesExclGST + serviceCGST + serviceSGST);

//     // Calculate sequential convenience fees
//     let currentAmount = baseTotal + serviceTotal;
//     let totalConvenienceExclGST = 0;
//     let totalConvenienceCGST = 0;
//     let totalConvenienceSGST = 0;
    
//     for (const percentage of convenienceFeePercentages) {
//         const convenienceExclGST = round2(currentAmount * percentage);
//         const convenienceCGST = round2(convenienceExclGST * 0.09);
//         const convenienceSGST = round2(convenienceExclGST * 0.09);
        
//         totalConvenienceExclGST += convenienceExclGST;
//         totalConvenienceCGST += convenienceCGST;
//         totalConvenienceSGST += convenienceSGST;
        
//         currentAmount += convenienceExclGST + convenienceCGST + convenienceSGST;
//     }
    
//     const convenienceTotal = round2(totalConvenienceExclGST + totalConvenienceCGST + totalConvenienceSGST);

//     // Recalculate subtotal to ensure accuracy
//     const calculatedSubtotal = round2(baseTotal + serviceTotal + convenienceTotal);
//     const calculatedDiscount = round2(calculatedSubtotal * discountPercentage);
//     const calculatedFinal = round2(calculatedSubtotal - calculatedDiscount);

//     return {
//         basePrice: basePriceExclGST,
//         baseCGST: baseCGST,
//         baseSGST: baseSGST,
//         baseTotal: baseTotal,
//         serviceCharges: serviceChargesExclGST,
//         serviceCGST: serviceCGST,
//         serviceSGST: serviceSGST,
//         serviceTotal: serviceTotal,
//         convenienceFee: totalConvenienceExclGST, // Backward compatible
//         convenienceCGST: totalConvenienceCGST,
//         convenienceSGST: totalConvenienceSGST,
//         convenienceTotal: convenienceTotal,
//         subtotalBeforeDiscount: calculatedSubtotal,
//         discountAmount: calculatedDiscount,
//         finalAmount: calculatedFinal,
//         totalCGST: round2(baseCGST + serviceCGST + totalConvenienceCGST),
//         totalSGST: round2(baseSGST + serviceSGST + totalConvenienceSGST),
//         totalGST: round2(baseCGST + baseSGST + serviceCGST + serviceSGST + totalConvenienceCGST + totalConvenienceSGST),
//         totalTaxable: round2(basePriceExclGST + serviceChargesExclGST + totalConvenienceExclGST),
//     };
// };

// export const reversePriceBreakup = (finalAmount: number) => {
//     // Use iterative approach to account for sequential fees
//     let basePrice = finalAmount / 1.2156862745; // Start with approximate multiplier
    
//     // Iterate to refine the calculation
//     for (let i = 0; i < 10; i++) {
//         const gstOnBase = basePrice * 0.05;
//         const commission = basePrice * 0.13;
//         const gstOnCommission = commission * 0.18;
        
//         // Calculate sequential convenience fees
//         let core = basePrice + gstOnBase + commission + gstOnCommission;
        
//         // Part 1: 1.6%
//         const convenienceFee1 = core * 0.016;
//         const gstOnConvenience1 = convenienceFee1 * 0.18;
//         core += convenienceFee1 + gstOnConvenience1;
        
//         // Part 2: 0.3%
//         const convenienceFee2 = core * 0.003;
//         const gstOnConvenience2 = convenienceFee2 * 0.18;
//         core += convenienceFee2 + gstOnConvenience2;
        
//         // Part 3: 1.9%
//         const convenienceFee3 = core * 0.019;
//         const gstOnConvenience3 = convenienceFee3 * 0.18;
//         core += convenienceFee3 + gstOnConvenience3;
        
//         const totalCheck = basePrice + gstOnBase + commission + gstOnCommission + 
//                           convenienceFee1 + gstOnConvenience1 + 
//                           convenienceFee2 + gstOnConvenience2 + 
//                           convenienceFee3 + gstOnConvenience3;
        
//         // Adjust base price
//         basePrice = basePrice * (finalAmount / totalCheck);
        
//         // Break if close enough
//         if (Math.abs(finalAmount - totalCheck) < 0.01) break;
//     }

//     // Final calculation
//     const gstOnBase = basePrice * 0.05;
//     const commission = basePrice * 0.13;
//     const gstOnCommission = commission * 0.18;
    
//     let core = basePrice + gstOnBase + commission + gstOnCommission;
    
//     const convenienceFee1 = core * 0.016;
//     const gstOnConvenience1 = convenienceFee1 * 0.18;
//     core += convenienceFee1 + gstOnConvenience1;
    
//     const convenienceFee2 = core * 0.003;
//     const gstOnConvenience2 = convenienceFee2 * 0.18;
//     core += convenienceFee2 + gstOnConvenience2;
    
//     const convenienceFee3 = core * 0.019;
//     const gstOnConvenience3 = convenienceFee3 * 0.18;
    
//     // Total convenience fee for backward compatibility
//     const convenienceFee = convenienceFee1 + convenienceFee2 + convenienceFee3;
//     const gstOnConvenience = gstOnConvenience1 + gstOnConvenience2 + gstOnConvenience3;
    
//     const totalCheck = basePrice + gstOnBase + commission + gstOnCommission + 
//                        convenienceFee + gstOnConvenience;

//     return {
//         basePrice: Math.round(basePrice),
//         gstOnBase,
//         commission,
//         gstOnCommission,
//         convenienceFee, // Backward compatible
//         gstOnConvenience, // Backward compatible
//         totalCheck: basePrice + gstOnBase + commission + gstOnCommission + convenienceFee + gstOnConvenience
//     };
// };

// src/utils/priceCalculations.ts

/**
 * Calculate the complete price breakdown including all fees and taxes
 * @param basePrice - The base room price (before any fees/taxes)
 * @returns Object containing all price components
 */
export const calculatePriceBreakdown = (basePrice: number) => {
    const numericBase = Number(basePrice) || 0;

    if (!numericBase || numericBase <= 0) {
        return {
            basePrice: 0,
            platformFee: 0,
            gstOnBase: 0,
            gstOnPlatform: 0,
            gatewayFee: 0,
            gstOnGateway: 0,
            gstTotal: 0,
            finalPrice: 0,
        };
    }

    const gstOnBase = numericBase * 0.05;
    const platformFeeBase = numericBase + gstOnBase;
    const platformFee = platformFeeBase * 0.13;
    const gstOnPlatform = platformFee * 0.18;
    const amountBeforeGateway = numericBase + gstOnBase + platformFee + gstOnPlatform;
    
    // Split into two parts: 1.6% and 0.3% (total 1.9%)
    // Part 1: 1.6%
    const gatewayFeePart1 = amountBeforeGateway * 0.016;
    const gstOnGatewayPart1 = gatewayFeePart1 * 0.18;
    
    // Part 2: 0.3% (calculated on amount after part 1)
    const amountAfterPart1 = amountBeforeGateway + gatewayFeePart1 + gstOnGatewayPart1;
    const gatewayFeePart2 = amountAfterPart1 * 0.003;
    const gstOnGatewayPart2 = gatewayFeePart2 * 0.18;
    
    // Total gateway fee and GST (backward compatible)
    const gatewayFee = gatewayFeePart1 + gatewayFeePart2;
    const gstOnGateway = gstOnGatewayPart1 + gstOnGatewayPart2;
    
    const gstTotal = gstOnBase + gstOnPlatform + gstOnGateway;
    const finalPrice = numericBase + platformFee + gstTotal;

    return {
        basePrice: numericBase,
        platformFee,
        gstOnBase,
        gstOnPlatform,
        gatewayFee,
        gstOnGateway,
        gstTotal,
        finalPrice,
    };
};

// Helper function to format INR currency
export const formatINR = (val: number) =>
    val.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
    });

// Optional: Function to calculate total price for multiple rooms/nights
export const calculateTotalPrice = (
    basePrice: number,
    roomsCount: number = 1,
    nights: number = 1
) => {
    const breakdown = calculatePriceBreakdown(basePrice);
    const perRoomFinal = breakdown.finalPrice;
    const perRoomBase = breakdown.basePrice;
    const perRoomPlatform = breakdown.platformFee;
    const perRoomGstTotal = breakdown.gstTotal;

    const multiplier = roomsCount * nights;

    return {
        ...breakdown,
        totalBase: +(perRoomBase * multiplier),
        totalPlatform: +(perRoomPlatform * multiplier),
        totalGst: +(perRoomGstTotal * multiplier),
        totalFinal: +(perRoomFinal * multiplier),
    };
};

export const calculatePriceBreakdown1 = (
    basePrice: number,
    mealPlanPrice: number = 0,
    discounts: {
        hotelDiscountValue: number;
        hotelDiscountType: 'percentage' | 'flat' | null;
        couponApplied: boolean;
        couponValue: number;
    }
) => {
    const numericBase = Number(basePrice) || 0;
    const numericMeal = Number(mealPlanPrice) || 0;

    if (!numericBase || numericBase <= 0) {
        return {
            basePrice: 0,
            mealPlanPrice: 0,
            gstOnBase: 0,
            platformFee: 0,
            gstOnPlatform: 0,
            convenienceFee: 0,
            gstOnConvenience: 0,
            totalWithoutDiscount: 0,
            hotelDiscount: 0,
            couponDiscount: 0,
            totalDiscount: 0,
            finalPrice: 0,
        };
    }

    // Total taxable value (base + meal plan)
    const totalTaxableValue = numericBase + numericMeal;

    // 1. GST on base + meal (5%)
    const gstOnBase = totalTaxableValue * 0.05;

    // Amount after base GST
    const amountAfterBaseGst = totalTaxableValue + gstOnBase;

    // 2. Platform fee (13% on base + GST)
    const platformFee = amountAfterBaseGst * 0.13;

    // 3. GST on platform fee (18%)
    const gstOnPlatform = platformFee * 0.18;

    // 4. Subtotal before convenience
    const subtotalBeforeConvenience =
        totalTaxableValue + gstOnBase + platformFee + gstOnPlatform;

    // Split into two parts: 1.6% and 0.3% (total 1.9%)
    // Part 1: 1.6%
    const convenienceFeePart1 = subtotalBeforeConvenience * 0.016;
    const gstOnConveniencePart1 = convenienceFeePart1 * 0.18;
    
    // Part 2: 0.3% (calculated on amount after part 1)
    const amountAfterPart1 = subtotalBeforeConvenience + convenienceFeePart1 + gstOnConveniencePart1;
    const convenienceFeePart2 = amountAfterPart1 * 0.003;
    const gstOnConveniencePart2 = convenienceFeePart2 * 0.18;
    
    // Total convenience fee and GST (backward compatible)
    const convenienceFee = convenienceFeePart1 + convenienceFeePart2;
    const gstOnConvenience = gstOnConveniencePart1 + gstOnConveniencePart2;

    // 7. Total without discount
    const totalWithoutDiscount =
        subtotalBeforeConvenience + convenienceFee + gstOnConvenience;

    // Calculate hotel discount
    let hotelDiscount = 0;
    if (discounts.hotelDiscountValue > 0 && discounts.hotelDiscountType) {
        if (discounts.hotelDiscountType === 'percentage') {
            // Percentage discount on total without discount
            hotelDiscount = totalWithoutDiscount * (discounts.hotelDiscountValue / 100);
        } else {
            // Flat discount
            hotelDiscount = Math.min(discounts.hotelDiscountValue, totalWithoutDiscount);
        }
    }

    // Calculate coupon discount (5% on total without discount)
    let couponDiscount = 0;
    if (discounts.couponApplied) {
        couponDiscount = totalWithoutDiscount * discounts.couponValue;
    }

    // Total discount
    const totalDiscount = hotelDiscount + couponDiscount;

    // Final price = total without discount - discounts
    const finalPrice = totalWithoutDiscount - totalDiscount;

    return {
        basePrice: numericBase,
        mealPlanPrice: numericMeal,
        gstOnBase,
        platformFee,
        gstOnPlatform,
        convenienceFee,
        gstOnConvenience,
        totalWithoutDiscount,
        hotelDiscount,
        couponDiscount,
        totalDiscount,
        finalPrice,
    };
};

export const round2 = (n: number) => Math.round(n * 100) / 100;

export const calculateInvoiceBreakdown = (finalAmount: number) => {
    const discountPercentage = 0.05; // 5% discount
    const serviceChargePercentage = 0.13; // 13% of Base Price WITH GST
    const convenienceFeePercentages = [0.016, 0.003]; // 1.6%, 0.3% (total 1.9%)

    // Step 1: Calculate subtotal before discount
    const subtotalBeforeDiscount = round2(finalAmount / (1 - discountPercentage));
    const discountAmount = round2(subtotalBeforeDiscount * discountPercentage);

    // Step 2: Find Base Price iteratively
    let basePriceExclGST = round2(subtotalBeforeDiscount / 1.23965);
    
    // Adjust the divisor for 1.9% instead of 3.8%
    basePriceExclGST = round2(basePriceExclGST * (3.8 / 1.9)); // Adjust for lower percentage
    
    // Iterate to refine the calculation due to sequential fees
    for (let i = 0; i < 5; i++) {
        const baseCGST = round2(basePriceExclGST * 0.025);
        const baseSGST = round2(basePriceExclGST * 0.025);
        const baseTotal = round2(basePriceExclGST + baseCGST + baseSGST);

        const serviceChargesExclGST = round2(baseTotal * serviceChargePercentage);
        const serviceCGST = round2(serviceChargesExclGST * 0.09);
        const serviceSGST = round2(serviceChargesExclGST * 0.09);
        const serviceTotal = round2(serviceChargesExclGST + serviceCGST + serviceSGST);

        // Calculate sequential convenience fees
        let currentAmount = baseTotal + serviceTotal;
        let totalConvenienceExclGST = 0;
        let totalConvenienceCGST = 0;
        let totalConvenienceSGST = 0;
        
        for (const percentage of convenienceFeePercentages) {
            const convenienceExclGST = round2(currentAmount * percentage);
            const convenienceCGST = round2(convenienceExclGST * 0.09);
            const convenienceSGST = round2(convenienceExclGST * 0.09);
            
            totalConvenienceExclGST += convenienceExclGST;
            totalConvenienceCGST += convenienceCGST;
            totalConvenienceSGST += convenienceSGST;
            
            currentAmount += convenienceExclGST + convenienceCGST + convenienceSGST;
        }
        
        const convenienceTotal = round2(totalConvenienceExclGST + totalConvenienceCGST + totalConvenienceSGST);
        const calculatedSubtotal = round2(baseTotal + serviceTotal + convenienceTotal);
        const calculatedFinal = round2(calculatedSubtotal * (1 - discountPercentage));
        
        // Adjust base price
        basePriceExclGST = round2(basePriceExclGST * (finalAmount / calculatedFinal));
    }

    // Final calculation with refined base price
    const baseCGST = round2(basePriceExclGST * 0.025);
    const baseSGST = round2(basePriceExclGST * 0.025);
    const baseTotal = round2(basePriceExclGST + baseCGST + baseSGST);

    const serviceChargesExclGST = round2(baseTotal * serviceChargePercentage);
    const serviceCGST = round2(serviceChargesExclGST * 0.09);
    const serviceSGST = round2(serviceChargesExclGST * 0.09);
    const serviceTotal = round2(serviceChargesExclGST + serviceCGST + serviceSGST);

    // Calculate sequential convenience fees
    let currentAmount = baseTotal + serviceTotal;
    let totalConvenienceExclGST = 0;
    let totalConvenienceCGST = 0;
    let totalConvenienceSGST = 0;
    
    for (const percentage of convenienceFeePercentages) {
        const convenienceExclGST = round2(currentAmount * percentage);
        const convenienceCGST = round2(convenienceExclGST * 0.09);
        const convenienceSGST = round2(convenienceExclGST * 0.09);
        
        totalConvenienceExclGST += convenienceExclGST;
        totalConvenienceCGST += convenienceCGST;
        totalConvenienceSGST += convenienceSGST;
        
        currentAmount += convenienceExclGST + convenienceCGST + convenienceSGST;
    }
    
    const convenienceTotal = round2(totalConvenienceExclGST + totalConvenienceCGST + totalConvenienceSGST);

    // Recalculate subtotal to ensure accuracy
    const calculatedSubtotal = round2(baseTotal + serviceTotal + convenienceTotal);
    const calculatedDiscount = round2(calculatedSubtotal * discountPercentage);
    const calculatedFinal = round2(calculatedSubtotal - calculatedDiscount);

    return {
        basePrice: basePriceExclGST,
        baseCGST: baseCGST,
        baseSGST: baseSGST,
        baseTotal: baseTotal,
        serviceCharges: serviceChargesExclGST,
        serviceCGST: serviceCGST,
        serviceSGST: serviceSGST,
        serviceTotal: serviceTotal,
        convenienceFee: totalConvenienceExclGST, // Backward compatible
        convenienceCGST: totalConvenienceCGST,
        convenienceSGST: totalConvenienceSGST,
        convenienceTotal: convenienceTotal,
        subtotalBeforeDiscount: calculatedSubtotal,
        discountAmount: calculatedDiscount,
        finalAmount: calculatedFinal,
        totalCGST: round2(baseCGST + serviceCGST + totalConvenienceCGST),
        totalSGST: round2(baseSGST + serviceSGST + totalConvenienceSGST),
        totalGST: round2(baseCGST + baseSGST + serviceCGST + serviceSGST + totalConvenienceCGST + totalConvenienceSGST),
        totalTaxable: round2(basePriceExclGST + serviceChargesExclGST + totalConvenienceExclGST),
    };
};

export const reversePriceBreakup = (finalAmount: number) => {
    // Adjust multiplier for 1.9% instead of 3.8%
    const multiplier = 1.2156862745 * (1.9 / 3.8); // Scale down for lower percentage
    let basePrice = finalAmount / multiplier; // Start with approximate multiplier
    
    // Iterate to refine the calculation
    for (let i = 0; i < 10; i++) {
        const gstOnBase = basePrice * 0.05;
        const commission = basePrice * 0.13;
        const gstOnCommission = commission * 0.18;
        
        // Calculate sequential convenience fees
        let core = basePrice + gstOnBase + commission + gstOnCommission;
        
        // Part 1: 1.6%
        const convenienceFee1 = core * 0.016;
        const gstOnConvenience1 = convenienceFee1 * 0.18;
        core += convenienceFee1 + gstOnConvenience1;
        
        // Part 2: 0.3%
        const convenienceFee2 = core * 0.003;
        const gstOnConvenience2 = convenienceFee2 * 0.18;
        core += convenienceFee2 + gstOnConvenience2;
        
        // No third part (1.9%)
        
        const totalCheck = basePrice + gstOnBase + commission + gstOnCommission + 
                          convenienceFee1 + gstOnConvenience1 + 
                          convenienceFee2 + gstOnConvenience2;
        
        // Adjust base price
        basePrice = basePrice * (finalAmount / totalCheck);
        
        // Break if close enough
        if (Math.abs(finalAmount - totalCheck) < 0.01) break;
    }

    // Final calculation
    const gstOnBase = basePrice * 0.05;
    const commission = basePrice * 0.13;
    const gstOnCommission = commission * 0.18;
    
    let core = basePrice + gstOnBase + commission + gstOnCommission;
    
    const convenienceFee1 = core * 0.016;
    const gstOnConvenience1 = convenienceFee1 * 0.18;
    core += convenienceFee1 + gstOnConvenience1;
    
    const convenienceFee2 = core * 0.003;
    const gstOnConvenience2 = convenienceFee2 * 0.18;
    
    // Total convenience fee for backward compatibility
    const convenienceFee = convenienceFee1 + convenienceFee2;
    const gstOnConvenience = gstOnConvenience1 + gstOnConvenience2;
    
    const totalCheck = basePrice + gstOnBase + commission + gstOnCommission + 
                       convenienceFee + gstOnConvenience;

    return {
        basePrice: Math.round(basePrice),
        gstOnBase,
        commission,
        gstOnCommission,
        convenienceFee, // Backward compatible
        gstOnConvenience, // Backward compatible
        totalCheck: basePrice + gstOnBase + commission + gstOnCommission + convenienceFee + gstOnConvenience
    };
};