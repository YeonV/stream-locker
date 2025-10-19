
const ContextWidget = () => {
  return (
    <div className="absolute top-0 left-0 bottom-0 right-0 z-10">
        <div className="h-20 pl-20 flex items-center border-b border-gray-700">
            Topbar
        </div>
        <div className="absolute top-20 left-0 right-0 bottom-20 flex items-center border-t border-gray-700">
            Content
        </div>
    </div>
  )
}

export default ContextWidget