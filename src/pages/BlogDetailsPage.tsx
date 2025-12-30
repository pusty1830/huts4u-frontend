import React from "react";
import { useParams, Link } from "react-router-dom";
import { blogPosts } from "../components/blog";
import {
    Box,
    Typography,
    Container,
    Breadcrumbs,
    Chip,
    Stack,
    Button,
    Divider,
    Card,
    CardContent,
    Grid,
    IconButton
} from "@mui/material";
import { Helmet } from "react-helmet-async";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import ShareIcon from '@mui/icons-material/Share';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { styled } from "@mui/material/styles";
import color from "../components/color";

const BlogDetailPage: React.FC = () => {
    const { slug } = useParams();
    const post = blogPosts.find((b) => b.slug === slug);
    const { firstColor, secondColor, thirdColor, forthColor, paperColor } = color;

    if (!post) return (
        <Container sx={{ py: 8, textAlign: "center" }}>
            <Typography variant="h4" color="error" gutterBottom>
                Blog Post Not Found
            </Typography>
            <Button
                component={Link}
                to="/blog"
                variant="contained"
                sx={{
                    backgroundColor: firstColor,
                    mt: 2,
                    '&:hover': {
                        backgroundColor: secondColor
                    }
                }}
            >
                Back to Blog
            </Button>
        </Container>
    );

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Generate related posts
    const relatedPosts = blogPosts
        .filter(p => p.id !== post.id && p.category === post.category)
        .slice(0, 3);

    // Generate schema data
    const generateSchemaData = () => {
        return {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "image": [post.image],
            "author": {
                "@type": "Organization",
                "name": post.author || "Huts4u",
                "url": "https://www.huts4u.com"
            },
            "publisher": {
                "@type": "Organization",
                "name": "Huts4u",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://www.huts4u.com/logo.png"
                }
            },
            "datePublished": post.publishedDate,
            "dateModified": post.publishedDate,
            "description": post.metaDescription || post.summary,
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": `https://www.huts4u.com/blog/${post.slug}`
            },
            "keywords": post.tags?.join(", ") || "",
            "articleSection": post.category || "Travel",
            "wordCount": post.content.split(" ").length
        };
    };

    // Generate breadcrumb schema
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://www.huts4u.com/"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Blog",
                "item": "https://www.huts4u.com/blog"
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": post.title,
                "item": `https://www.huts4u.com/blog/${post.slug}`
            }
        ]
    };

    // Styled components
    const BlogHeader = styled(Box)({
        background: `linear-gradient(135deg, ${firstColor}15 0%, ${secondColor}10 100%)`,
        borderRadius: "24px",
        padding: "40px",
        marginBottom: "40px",
        border: `1px solid ${firstColor}20`
    });

    const TagChip = styled(Chip)({
        backgroundColor: `${firstColor}20`,
        color: firstColor,
        fontWeight: 600,
        marginRight: "8px",
        marginBottom: "8px",
        '&:hover': {
            backgroundColor: `${firstColor}30`
        }
    });

    const ShareButton = styled(IconButton)({
        color: forthColor,
        backgroundColor: "white",
        border: `1px solid ${forthColor}30`,
        margin: "0 4px",
        '&:hover': {
            backgroundColor: firstColor,
            color: "white"
        }
    });

    return (
        <>
            <Helmet>
                <title>{post.title} | Huts4u Blog - Hourly Hotels in Bhubaneswar</title>
                <meta name="description" content={post.metaDescription || post.summary} />
                <meta name="keywords" content={post.tags?.join(", ") || ""} />
                <meta name="author" content={post.author || "Huts4u"} />
                <link rel="canonical" href={`https://www.huts4u.com/blog/${post.slug}`} />

                {/* Open Graph Tags */}
                <meta property="og:type" content="article" />
                <meta property="og:title" content={post.title} />
                <meta property="og:description" content={post.metaDescription || post.summary} />
                <meta property="og:image" content={post.image} />
                <meta property="og:url" content={`https://www.huts4u.com/blog/${post.slug}`} />
                <meta property="og:site_name" content="Huts4u" />
                <meta property="article:published_time" content={post.publishedDate} />
                <meta property="article:author" content={post.author || "Huts4u"} />
                <meta property="article:section" content={post.category || "Travel"} />

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={post.title} />
                <meta name="twitter:description" content={post.metaDescription || post.summary} />
                <meta name="twitter:image" content={post.image} />

                {/* JSON-LD Schema */}
                <script type="application/ld+json">
                    {JSON.stringify(generateSchemaData())}
                </script>

                <script type="application/ld+json">
                    {JSON.stringify(breadcrumbSchema)}
                </script>
            </Helmet>

            <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
                {/* Breadcrumbs */}
                <Breadcrumbs sx={{ mb: 4, color: forthColor }}>
                    <Link to="/" style={{ color: firstColor, textDecoration: "none", fontWeight: 500 }}>
                        Home
                    </Link>
                    <Link to="/blog" style={{ color: firstColor, textDecoration: "none", fontWeight: 500 }}>
                        Blog
                    </Link>
                    <Typography color="text.primary" sx={{ fontWeight: 600 }}>
                        {post.title}
                    </Typography>
                </Breadcrumbs>

                {/* Back Button */}
                <Button
                    component={Link}
                    to="/blog"
                    startIcon={<ArrowBackIcon />}
                    sx={{
                        mb: 4,
                        color: firstColor,
                        textTransform: "none",
                        fontWeight: 600,
                        '&:hover': {
                            backgroundColor: `${firstColor}10`
                        }
                    }}
                >
                    Back to All Articles
                </Button>

                {/* Blog Header */}
                <BlogHeader>
                    <Box sx={{ mb: 3 }}>
                        <Chip
                            label={post.category || "Travel Guide"}
                            sx={{
                                backgroundColor: firstColor,
                                color: "white",
                                fontWeight: 700,
                                mb: 2
                            }}
                        />
                        <Typography
                            variant="h1"
                            sx={{
                                fontWeight: 800,
                                mb: 2,
                                fontSize: { xs: '2rem', md: '3rem' },
                                color: firstColor,
                                lineHeight: 1.2
                            }}
                        >
                            {post.title}
                        </Typography>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" sx={{ mb: 3 }}>
                            <Box sx={{ display: "flex", alignItems: "center", color: forthColor }}>
                                <PersonIcon sx={{ fontSize: 16, mr: 1, color: firstColor }} />
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    By {post.author || "Huts4u Team"}
                                </Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", color: forthColor }}>
                                <CalendarTodayIcon sx={{ fontSize: 16, mr: 1, color: firstColor }} />
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    Published: {formatDate(post.publishedDate)}
                                </Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", color: forthColor }}>
                                <AccessTimeIcon sx={{ fontSize: 16, mr: 1, color: firstColor }} />
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {post.readTime || "5 min read"}
                                </Typography>
                            </Box>
                        </Stack>

                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: forthColor }}>
                                    Topics:
                                </Typography>
                                <Box>
                                    {post.tags.map((tag, index) => (
                                        <TagChip
                                            key={index}
                                            label={tag}
                                            size="small"
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Box>

                    {/* Featured Image */}
                    <Box sx={{
                        borderRadius: "16px",
                        overflow: "hidden",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                        mb: 3
                    }}>
                        <img
                            src={post.image}
                            alt={post.title}
                            loading="lazy"
                            style={{
                                width: "100%",
                                height: "400px",
                                objectFit: "cover",
                                display: "block"
                            }}
                            
                        />
                    </Box>

                    {/* Share Buttons */}
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: forthColor }}>
                                Share this article:
                            </Typography>
                            <Box>
                                <ShareButton
                                    size="small"
                                    aria-label="Share on Facebook"
                                    onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=https://www.huts4u.com/blog/${post.slug}`, '_blank')}
                                >
                                    <FacebookIcon fontSize="small" />
                                </ShareButton>
                                <ShareButton
                                    size="small"
                                    aria-label="Share on Twitter"
                                    onClick={() => window.open(`https://twitter.com/intent/tweet?url=https://www.huts4u.com/blog/${post.slug}&text=${encodeURIComponent(post.title)}`, '_blank')}
                                >
                                    <TwitterIcon fontSize="small" />
                                </ShareButton>
                                <ShareButton
                                    size="small"
                                    aria-label="Share on LinkedIn"
                                    onClick={() => window.open(`https://www.linkedin.com/shareArticle?mini=true&url=https://www.huts4u.com/blog/${post.slug}&title=${encodeURIComponent(post.title)}`, '_blank')}
                                >
                                    <LinkedInIcon fontSize="small" />
                                </ShareButton>
                                <ShareButton
                                    size="small"
                                    aria-label="Share on WhatsApp"
                                    onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(post.title + ' - https://www.huts4u.com/blog/' + post.slug)}`, '_blank')}
                                >
                                    <WhatsAppIcon fontSize="small" />
                                </ShareButton>
                            </Box>
                        </Box>
                        <Button
                            startIcon={<BookmarkIcon />}
                            sx={{
                                color: firstColor,
                                textTransform: "none",
                                '&:hover': {
                                    backgroundColor: `${firstColor}10`
                                }
                            }}
                        >
                            Save for later
                        </Button>
                    </Box>
                </BlogHeader>

                {/* Blog Content */}
                <Box sx={{
                    maxWidth: "800px",
                    mx: "auto",
                    mb: 8
                }}>
                    <Box sx={{
                        fontSize: "1.1rem",
                        lineHeight: 1.8,
                        color: "#333"
                    }}>
                        {/* Introduction */}
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 600,
                                mb: 3,
                                color: firstColor,
                                fontSize: "1.25rem"
                            }}
                        >
                            {post.summary}
                        </Typography>

                        <Divider sx={{ my: 4, borderColor: `${firstColor}20` }} />

                        {/* Main Content */}
                        <Box
                            sx={{
                                '& p': { mb: 3 },
                                '& h2': {
                                    fontWeight: 700,
                                    mb: 2,
                                    mt: 4,
                                    color: firstColor,
                                    fontSize: "1.75rem"
                                },
                                '& h3': {
                                    fontWeight: 600,
                                    mb: 2,
                                    mt: 3,
                                    color: secondColor,
                                    fontSize: "1.5rem"
                                },
                                '& ul, & ol': {
                                    pl: 4,
                                    mb: 3
                                },
                                '& li': {
                                    mb: 1
                                },
                                '& strong': {
                                    color: firstColor,
                                    fontWeight: 600
                                },
                                '& a': {
                                    color: firstColor,
                                    textDecoration: 'none',
                                    fontWeight: 500,
                                    '&:hover': {
                                        textDecoration: 'underline'
                                    }
                                },
                                '& blockquote': {
                                    borderLeft: `4px solid ${firstColor}`,
                                    pl: 3,
                                    py: 2,
                                    my: 4,
                                    backgroundColor: `${firstColor}08`,
                                    fontStyle: 'italic',
                                    color: forthColor
                                }
                            }}
                        >
                            {/* This would be parsed from markdown or rich text in a real app */}
                            <div dangerouslySetInnerHTML={{ __html: post.content }} />

                            {/* If content is plain text, render as paragraphs */}
                            {!post.content.includes('<') && post.content.split('\n').map((paragraph, index) => (
                                <Typography key={index} paragraph sx={{ mb: 3 }}>
                                    {paragraph}
                                </Typography>
                            ))}
                        </Box>



                    </Box>
                </Box>

                {/* Related Articles */}
                {relatedPosts.length > 0 && (
                    <Box sx={{ mb: 8 }}>
                        <Typography
                            variant="h3"
                            sx={{
                                fontWeight: 700,
                                mb: 4,
                                color: firstColor,
                                textAlign: "center",
                                fontSize: { xs: '1.75rem', md: '2.25rem' }
                            }}
                        >
                            Related Articles
                        </Typography>

                        <Grid container spacing={3}>
                            {relatedPosts.map((relatedPost) => (
                                <Grid item xs={12} md={4} key={relatedPost.id}>
                                    <Card sx={{
                                        height: "100%",
                                        transition: "transform 0.3s ease",
                                        '&:hover': {
                                            transform: "translateY(-8px)",
                                            boxShadow: `0 12px 28px rgba(${parseInt(firstColor.slice(1, 3), 16)}, ${parseInt(firstColor.slice(3, 5), 16)}, ${parseInt(firstColor.slice(5, 7), 16)}, 0.15)`
                                        }
                                    }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    fontWeight: 700,
                                                    mb: 2,
                                                    color: firstColor,
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: "vertical",
                                                    overflow: "hidden",
                                                    minHeight: "3.5em"
                                                }}
                                            >
                                                {relatedPost.title}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    mb: 3,
                                                    color: forthColor,
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: "vertical",
                                                    overflow: "hidden"
                                                }}
                                            >
                                                {relatedPost.summary}
                                            </Typography>
                                            <Button
                                                component={Link}
                                                to={`/blog/${relatedPost.slug}`}
                                                sx={{
                                                    color: firstColor,
                                                    textTransform: "none",
                                                    fontWeight: 600,
                                                    padding: 0,
                                                    '&:hover': {
                                                        backgroundColor: "transparent",
                                                        color: secondColor
                                                    }
                                                }}
                                            >
                                                Read More →
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}

                {/* Back to Top & Navigation */}
                <Box sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    pt: 4,
                    borderTop: `1px solid ${firstColor}20`
                }}>
                    <Button
                        component={Link}
                        to="/blog"
                        startIcon={<ArrowBackIcon />}
                        sx={{
                            color: firstColor,
                            textTransform: "none",
                            fontWeight: 600,
                            '&:hover': {
                                backgroundColor: `${firstColor}10`
                            }
                        }}
                    >
                        All Blog Posts
                    </Button>

                    <Button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        sx={{
                            color: firstColor,
                            textTransform: "none",
                            fontWeight: 600,
                            '&:hover': {
                                backgroundColor: `${firstColor}10`
                            }
                        }}
                    >
                        Back to Top ↑
                    </Button>
                </Box>
            </Container>
        </>
    );
};

export default BlogDetailPage;