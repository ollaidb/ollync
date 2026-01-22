import './PostCardSkeleton.css'

interface PostCardSkeletonProps {
  viewMode?: 'list' | 'grid'
  count?: number
}

export const PostCardSkeleton = ({ viewMode = 'grid', count = 1 }: PostCardSkeletonProps) => {
  const skeletons = Array.from({ length: count }, (_, i) => (
    <div key={i} className={`post-card-skeleton post-card-skeleton-${viewMode}`}>
      <div className="post-card-skeleton-image"></div>
      <div className="post-card-skeleton-content">
        <div className="post-card-skeleton-title"></div>
        <div className="post-card-skeleton-title-short"></div>
        <div className="post-card-skeleton-info">
          <div className="post-card-skeleton-badge"></div>
          <div className="post-card-skeleton-badge"></div>
        </div>
        <div className="post-card-skeleton-profile">
          <div className="post-card-skeleton-avatar"></div>
          <div className="post-card-skeleton-name"></div>
        </div>
      </div>
    </div>
  ))

  return <>{skeletons}</>
}


