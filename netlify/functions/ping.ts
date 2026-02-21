export const handler = async () => {
    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Netlify Functions are working!", time: new Date().toISOString() })
    };
};
