export function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="card" style={{borderColor:'rgba(59,130,246,0.35)', marginBottom:12}}>
      {msg}
    </div>
  );
}
