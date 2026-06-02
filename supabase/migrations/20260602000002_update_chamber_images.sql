UPDATE spaces
SET featured_image = '/images/the-chamber/1.png',
    images = ARRAY['/images/the-chamber/1.png', '/images/the-chamber/2.jpg', '/images/the-chamber/3.jpg', '/images/the-chamber/4.jpg', '/images/the-chamber/5.jpg']
WHERE slug = 'the-chamber';
