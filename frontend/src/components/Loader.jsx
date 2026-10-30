const Loader = ({ size = 'md', text = '' }) => {
  return (
    <div className={`loader-wrapper loader-${size}`}>
      <div className="spinner"></div>
      {text && <p>{text}</p>}
    </div>
  );
};

export default Loader;