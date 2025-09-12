import Hero from '../components/home/Hero'
import ProductShowcase from '../components/home/ProductShowcase'
import PhotoDivider from '../components/home/PhotoDivider'
import RecipeTeasers from '../components/home/RecipeTeasers'
import About from '../components/home/About'

function Home() {
  return (
    <>
      <Hero />
      <ProductShowcase />
      <PhotoDivider />
      <RecipeTeasers />
      <About />
    </>
  )
}

export default Home
