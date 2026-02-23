export default function TestCSS() {
    return (
        <div className="p-10 bg-red-500 text-white font-bold text-3xl">
            Tailwind Check - Is this red?
            <div style={{ backgroundColor: 'blue', padding: '20px', marginTop: '10px' }}>
                Inline Styles - Is this blue?
            </div>
        </div>
    );
}
