import type { NextPageContext } from 'next';

function ErrorPage({ statusCode }: { statusCode?: number }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
        background: '#0f0f0f',
        color: '#fff',
        fontFamily: 'Inter, system-ui, sans-serif',
        textAlign: 'center',
      }}
    >
      <div>
        <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.7 }}>Qulaymarket</p>
        <h1 style={{ margin: '0.75rem 0 0', fontSize: '2rem', fontWeight: 800 }}>
          {statusCode ? `${statusCode} xatolik` : 'Nomaʼlum xatolik'}
        </h1>
        <p style={{ margin: '0.75rem 0 0', opacity: 0.8 }}>
          Sahifani yangilab ko‘ring yoki keyinroq qayta urinib ko‘ring.
        </p>
      </div>
    </main>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 500;
  return { statusCode };
};

export default ErrorPage;
