import { motion } from 'framer-motion'
import { useState } from 'react'
import { ArrowRight, Calendar, User, Tag } from 'lucide-react'
import MarketingPageShell from '../components/MarketingPageShell.jsx'

const F_HEAD = "'EB Garamond','Cormorant Garamond',Georgia,serif"
const F_BODY = "'Inter','DM Sans',sans-serif"

const BLOG_POSTS = [
  {
    id: 1,
    title: 'AWS Solutions Architect Associate vs Azure Administrator: Which Certification Pays More?',
    excerpt: "Compare salary outcomes, job demand, and ROI for two of India's most popular cloud certifications.",
    date: '2025-03-15',
    author: 'Certify Team',
    tags: ['AWS', 'Azure', 'Cloud', 'Comparison'],
    readTime: '8 min read',
  },
  {
    id: 2,
    title: 'The 2025 Certification Salary Report: What You Need to Know',
    excerpt: 'Based on data from 40,000+ India professionals - updated salary trends across 25+ certifications.',
    date: '2025-03-10',
    author: 'Certify Research',
    tags: ['Salary', 'Trends', 'Research'],
    readTime: '12 min read',
  },
  {
    id: 3,
    title: 'How Long Does It Actually Take to Break Even on a Certification?',
    excerpt: 'Real data on certification ROI timelines. From study hours to salary increase - the complete breakdown.',
    date: '2025-03-05',
    author: 'Certify Team',
    tags: ['ROI', 'Career', 'Analysis'],
    readTime: '6 min read',
  },
  {
    id: 4,
    title: 'Why College Graduates Are Now Pursuing Certifications in 2025',
    excerpt: 'The shift in Indian tech careers: Traditional degrees vs corporate certification programs.',
    date: '2025-02-28',
    author: 'Certify Team',
    tags: ['Education', 'Career Path', 'Trends'],
    readTime: '9 min read',
  },
  {
    id: 5,
    title: 'Kubernetes, Terraform, DevOps: Which Skills Pay Best?',
    excerpt: 'DevOps certification breakdown - salary comparisons, job demand heatmap, and 5-year projections.',
    date: '2025-02-20',
    author: 'Certify Research',
    tags: ['DevOps', 'Skills', 'Salary'],
    readTime: '10 min read',
  },
  {
    id: 6,
    title: 'Data Analytics Career in 2025: Microsoft, Google, or Tableau?',
    excerpt: 'Which data certification should you pursue? Salary, demand, and career growth analysis.',
    date: '2025-02-15',
    author: 'Certify Team',
    tags: ['Data Analytics', 'Career', 'Comparison'],
    readTime: '7 min read',
  },
]

export default function BlogPage() {
  const [selectedTag, setSelectedTag] = useState(null)

  const filteredPosts = selectedTag
    ? BLOG_POSTS.filter(post => post.tags.includes(selectedTag))
    : BLOG_POSTS

  const allTags = [...new Set(BLOG_POSTS.flatMap(post => post.tags))].sort()

  return (
    <MarketingPageShell
      eyebrow="BLOG"
      title="Certification Insights"
      accent="and Career Data"
      subtitle="Real data-driven articles about Indian tech salaries, certification ROI, and career growth strategies."
    >
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '0 0 12px',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '40px',
          }}
        >
          <button
            onClick={() => setSelectedTag(null)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: selectedTag === null ? '2px solid var(--accent)' : '1px solid var(--border)',
              background: selectedTag === null ? 'var(--indigo-dim)' : 'transparent',
              color: 'var(--text-2)',
              fontFamily: F_BODY,
              fontSize: '13px',
              fontWeight: selectedTag === null ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            All Articles
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: selectedTag === tag ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: selectedTag === tag ? 'transparent' : 'transparent',
                color: 'var(--text-2)',
                fontFamily: F_BODY,
                fontSize: '13px',
                fontWeight: selectedTag === tag ? '600' : '400',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Tag size={12} style={{ display: 'inline', marginRight: '6px' }} />
              {tag}
            </button>
          ))}
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px',
        }}>
          {filteredPosts.map((post, idx) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              whileHover={{ y: -4 }}
              style={{
                padding: '24px',
                border: '1px solid var(--border)',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.boxShadow = 'var(--shadow-2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
                fontSize: '12px',
                color: 'var(--text-3)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} />
                  {new Date(post.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <span style={{ color: 'var(--text-4)' }}>•</span>
                <span>{post.readTime}</span>
              </div>

              <h3 style={{
                fontFamily: F_HEAD,
                fontSize: '26px',
                fontWeight: '700',
                color: 'var(--text)',
                marginBottom: '12px',
                lineHeight: 1.2,
                minHeight: '86px',
              }}>
                {post.title}
              </h3>

              <p style={{
                fontFamily: F_BODY,
                fontSize: '14px',
                color: 'var(--text-2)',
                lineHeight: 1.5,
                marginBottom: '16px',
                minHeight: '42px',
              }}>
                {post.excerpt}
              </p>

              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                marginBottom: '16px',
              }}>
                {post.tags.slice(0, 2).map(tag => (
                  <span
                    key={tag}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      background: 'transparent',
                      color: 'var(--accent)',
                      fontSize: '11px',
                      fontWeight: '600',
                    }}
                  >
                    {tag}
                  </span>
                ))}
                {post.tags.length > 2 && (
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    background: 'transparent',
                    color: 'var(--accent)',
                    fontSize: '11px',
                    fontWeight: '600',
                  }}>
                    +{post.tags.length - 2}
                  </span>
                )}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '16px',
                borderTop: '1px solid var(--border)',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: 'var(--text-3)',
                }}>
                  <User size={12} />
                  {post.author}
                </div>
                <ArrowRight size={14} color="var(--accent)" />
              </div>
            </motion.div>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              textAlign: 'center',
              padding: '60px 24px',
            }}
          >
            <p style={{
              fontFamily: F_BODY,
              fontSize: '16px',
              color: 'var(--text-2)',
            }}>
              No articles found for this tag. Try a different filter.
            </p>
          </motion.div>
        )}
      </div>
    </MarketingPageShell>
  )
}
