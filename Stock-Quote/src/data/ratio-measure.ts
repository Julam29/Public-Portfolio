
export const measureRatio = (value: number, ratio: string, industry: string): string => {
    
    if (ratio === "PE") {
        if (industry === "Technology") {
            if (value < 25) return "Potentially Undervalued"
            if (value > 35) return "Potentially Overvalued"
            else return "Fairly Valued"
        }


    }


    return "s";
}