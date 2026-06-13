export const formatMillions = (value: number): string => {
    let convertedValue: number;
    if (value < 1) {
        convertedValue = value*1000;
        return `${(convertedValue / 1_000_000).toFixed(2)}K`;
    }

    else if (value < 1000) {
        return `${(value.toFixed(2))}M`
    }
    else if (value < 1000000) {
        convertedValue = value/1000;
        return `${(convertedValue).toFixed(2)}B`;
    }
    else {
        return `${(value/1000000).toFixed(2)}T`;
    }
}

// return await formatMillions(value);